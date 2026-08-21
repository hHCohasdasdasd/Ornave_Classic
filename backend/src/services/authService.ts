import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { PasswordManager } from '../utils/passwordManager';
import { TokenManager } from '../utils/tokenManager';
import { ERROR_MESSAGES } from '../constants';
import { sendEmail } from '../utils/email';
import { PlaidService } from './plaidService';
import { StripeService } from './stripeService';
import { MembershipService } from './membershipService';

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issues a fresh email-verification token for a user, stores its hash, and
 * emails the link. Falls back to a console log if RESEND_API_KEY isn't
 * configured (see utils/email.ts) so local dev keeps working either way.
 */
async function issueEmailVerificationToken(userId: string, email: string): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: hashToken(rawToken),
      emailVerificationExpiry: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
  const verificationLink = `${frontendUrl}/verify-email?token=${rawToken}`;
  console.log(`[EmailVerification] Verification link for ${email}: ${verificationLink}`);

  await sendEmail(
    email,
    'Verify your email for Ornave',
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #14140f;">Confirm your email</h2>
      <p>Click the link below to verify your Ornave account. This link expires in 24 hours.</p>
      <p><a href="${verificationLink}" style="display: inline-block; background: #c6a15b; color: #14140f; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 700;">Verify email</a></p>
      <p style="color: #888; font-size: 0.85rem;">If the button doesn't work, paste this link into your browser:<br>${verificationLink}</p>
    </div>`
  );
}

const prisma = new PrismaClient();

// User role constants (replaced enums for SQLite compatibility)
export const UserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  USER: 'USER',
} as const;

export const UserType = {
  USER: 'USER',
  COMPANY_USER: 'COMPANY_USER',
} as const;

/**
 * Authentication Service
 * Handles user registration, login, and token management
 * Enforces multi-tenancy through company-based isolation
 */

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

async function logAuthEvent(
  eventType:
    | 'REGISTER'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_PERMANENTLY_LOCKED'
    | 'ACCOUNT_UNLOCKED'
    | 'PASSWORD_CHANGED'
    | 'EMAIL_VERIFIED'
    | 'PASSWORD_RESET_REQUESTED'
    | 'PASSWORD_RESET_COMPLETED'
    | 'TWO_FACTOR_ENABLED'
    | 'TWO_FACTOR_DISABLED'
    | 'ACCOUNT_DELETED'
    | 'ACCOUNT_PURGED',
  email: string,
  userId?: string | null,
  meta?: RequestMeta
) {
  try {
    await prisma.authAuditLog.create({
      data: {
        eventType,
        email,
        userId: userId || undefined,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });
  } catch (err) {
    // Audit logging must never break the auth flow itself.
    console.error('[AuthAuditLog] failed to record event:', err);
  }
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  companyId?: string;
  companyName?: string;
  userType?: keyof typeof UserType;
  businessType?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    memberNumber: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string | null;
    userType: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    industry: string | null;
    createdAt: Date;
  } | null;
}

export interface Pending2FAResponse {
  pending2FA: true;
  pendingToken: string;
}

export class AuthService {
  /**
   * Register new user
   * If no companyId provided, creates a new company for the user
   * First user in company automatically becomes OWNER
   */
  static async register(data: RegisterData, meta?: RequestMeta): Promise<AuthResponse> {
    const accountType = data.userType || UserType.COMPANY_USER;
    let companyId = data.companyId;

    if (accountType === UserType.COMPANY_USER) {
      // If no company ID provided, create a new company
      if (!companyId) {
        if (!data.companyName) {
          throw new Error('Either companyId or companyName must be provided');
        }

        const slug = data.companyName.toLowerCase().replace(/\s+/g, '-');
        
        const company = await prisma.company.create({
          data: {
            name: data.companyName,
            slug: `${slug}-${Date.now()}`, // Make slug unique
            description: `Company created for ${data.firstName} ${data.lastName}`,
            industry: data.businessType || undefined,
          },
        });

        companyId = company.id;
      } else {
        // Validate company exists
        const company = await prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company) {
          throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
        }
      }
    } else {
      companyId = null;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await PasswordManager.hashPassword(data.password);

    // Create user (first user in company is automatically OWNER)
    let role: string = UserRole.USER;
    if (accountType === UserType.COMPANY_USER) {
      const userCount = await prisma.user.count({
        where: { companyId: companyId || undefined },
      });
      role = userCount === 0 ? UserRole.OWNER : UserRole.EMPLOYEE;
    }

    // Member numbers are permanent and sequential across all accounts,
    // starting at 1 in the order accounts are created — assigned inside the
    // same transaction as the insert so two concurrent signups can't land
    // on the same number.
    const user = await prisma.$transaction(async (tx) => {
      const { _max } = await tx.user.aggregate({ _max: { memberNumber: true } });
      const memberNumber = (_max.memberNumber || 0) + 1;

      return tx.user.create({
        data: {
          memberNumber,
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          companyId: companyId || undefined,
          role,
          userType: accountType,
          profile: accountType === UserType.USER ? {
            create: {
              displayName: `${data.firstName} ${data.lastName}`,
            },
          } : undefined,
        },
        include: { company: true },
      });
    });

    // Generate token
    const token = TokenManager.generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      userType: user.userType,
    });

    await logAuthEvent('REGISTER', user.email, user.id, meta);
    await issueEmailVerificationToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        memberNumber: user.memberNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        userType: user.userType,
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        description: user.company.description,
        industry: user.company.industry,
        createdAt: user.company.createdAt,
      } : null,
    };
  }

  /**
   * Login user with email and password
   */
  private static readonly MAX_FAILED_ATTEMPTS = 5;

  // Escalating lockout durations, indexed by (lockoutCount - 1): 1st lockout
  // is 15 minutes, 2nd is 1 hour, 3rd is 24 hours, 4th is 72 hours. A 5th
  // lockout goes permanent — the account stays locked until an admin clears
  // `permanentlyLocked` directly (there's no self-service unlock for that
  // tier by design). lockoutCount never auto-decays; it's a lifetime count
  // of how many times this account has tripped the failed-attempt threshold.
  private static readonly LOCKOUT_TIERS_MS = [
    15 * 60 * 1000,
    60 * 60 * 1000,
    24 * 60 * 60 * 1000,
    72 * 60 * 60 * 1000,
  ];

  static async login(credentials: LoginCredentials, meta?: RequestMeta): Promise<AuthResponse | Pending2FAResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: { company: true },
    });

    if (!user) {
      await logAuthEvent('LOGIN_FAILED', credentials.email, null, meta);
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.permanentlyLocked) {
      await logAuthEvent('LOGIN_FAILED', user.email, user.id, meta);
      throw new Error(
        'This account has been permanently locked after repeated failed login attempts. Contact support to regain access.'
      );
    }

    // Check if the account is currently locked out from too many failed attempts
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      const humanTime =
        minutesLeft >= 60 ? `${Math.ceil(minutesLeft / 60)} hour(s)` : `${minutesLeft} minute(s)`;
      await logAuthEvent('LOGIN_FAILED', user.email, user.id, meta);
      throw new Error(
        `Account temporarily locked due to too many failed login attempts. Try again in ${humanTime}.`
      );
    }

    // Verify password
    const isPasswordValid = await PasswordManager.verifyPassword(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= this.MAX_FAILED_ATTEMPTS;

      if (shouldLock) {
        const newLockoutCount = user.lockoutCount + 1;
        const tierIndex = newLockoutCount - 1;
        const goesPermanent = tierIndex >= this.LOCKOUT_TIERS_MS.length;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutCount: newLockoutCount,
            permanentlyLocked: goesPermanent,
            lockedUntil: goesPermanent ? null : new Date(Date.now() + this.LOCKOUT_TIERS_MS[tierIndex]),
          },
        });

        await logAuthEvent(goesPermanent ? 'ACCOUNT_PERMANENTLY_LOCKED' : 'ACCOUNT_LOCKED', user.email, user.id, meta);

        const lockoutMinutes = goesPermanent ? null : Math.round(this.LOCKOUT_TIERS_MS[tierIndex] / 60000);
        sendEmail(
          user.email,
          goesPermanent ? 'Your Ornave account has been locked' : 'Unusual sign-in activity on your Ornave account',
          `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #14140f;">${goesPermanent ? 'Account locked' : 'Too many failed sign-in attempts'}</h2>
            <p>We locked your Ornave account after repeated failed login attempts${goesPermanent ? '' : ` for ${lockoutMinutes} minute(s)`}.</p>
            ${goesPermanent ? '<p>This account is now permanently locked and needs a password reset to regain access.</p>' : ''}
            <p>If this wasn't you, someone may be trying to guess your password — consider resetting it once you're back in.</p>
          </div>`
        ).catch(() => {});
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: failedAttempts },
        });
        await logAuthEvent('LOGIN_FAILED', user.email, user.id, meta);
      }

      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    if (!user.emailVerified) {
      await logAuthEvent('LOGIN_FAILED', user.email, user.id, meta);
      throw new Error('Please verify your email before logging in. Check your inbox for the verification link, or request a new one.');
    }

    // Successful login — reset the failed-attempt/lock state (but not the
    // lifetime lockoutCount — escalation deliberately remembers) and update
    // last login.
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    });

    if (user.twoFactorEnabled) {
      // Password was correct, but a second factor is still required — issue
      // only a short-lived pending token, not a real session. LOGIN_SUCCESS
      // is logged once the 2FA step also passes, in verifyLogin2FA below.
      const pendingToken = TokenManager.generatePending2FAToken({
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
        userType: user.userType,
      });
      return { pending2FA: true, pendingToken };
    }

    await logAuthEvent('LOGIN_SUCCESS', user.email, user.id, meta);

    // Generate token
    const token = TokenManager.generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      userType: user.userType,
    });

    return {
      token,
      user: {
        id: user.id,
        memberNumber: user.memberNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        userType: user.userType,
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        description: user.company.description,
        industry: user.company.industry,
        createdAt: user.company.createdAt,
      } : null,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        memberNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        userType: true,
        isActive: true,
        createdAt: true,
        isPlatformAdmin: true,
        twoFactorEnabled: true,
        profile: {
          select: {
            phone: true,
            bio: true,
            website: true,
            displayName: true,
            avatarUrl: true,
            address: true,
            streetAddress: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Verify token validity
   */
  static async verifyTokenValidity(token: string): Promise<boolean> {
    try {
      TokenManager.verifyToken(token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    meta?: RequestMeta
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify old password
    const isPasswordValid = await PasswordManager.verifyPassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await PasswordManager.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await logAuthEvent('PASSWORD_CHANGED', user.email, user.id, meta);
  }

  /**
   * Issue a password-reset link. Always resolves silently regardless of
   * whether the email is registered, so this can't be used to enumerate
   * accounts — the frontend shows the same generic message either way.
   */
  static async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hashToken(rawToken),
        passwordResetExpiry: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    console.log(`[PasswordReset] Reset link for ${email}: ${resetLink}`);

    await sendEmail(
      email,
      'Reset your Ornave password',
      `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #14140f;">Reset your password</h2>
        <p>Someone (hopefully you) asked to reset the password on this account. This link expires in 1 hour and can only be used once.</p>
        <p><a href="${resetLink}" style="display: inline-block; background: #c6a15b; color: #14140f; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 700;">Reset password</a></p>
        <p style="color: #888; font-size: 0.85rem;">If you didn't request this, you can safely ignore this email — your password won't change unless you click the link above.</p>
        <p style="color: #888; font-size: 0.85rem;">If the button doesn't work, paste this link into your browser:<br>${resetLink}</p>
      </div>`
    );

    await logAuthEvent('PASSWORD_RESET_REQUESTED', user.email, user.id);
  }

  /**
   * Complete a password reset from the raw token in the link. Also clears
   * any active lockout — successfully proving ownership of the mailbox is
   * at least as strong a signal as the failed-attempt counter it resets.
   */
  static async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const user = await prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } });

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new Error('Reset link is invalid or has expired');
    }

    const hashedPassword = await PasswordManager.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        permanentlyLocked: false,
      },
    });

    await logAuthEvent('PASSWORD_RESET_COMPLETED', user.email, user.id);
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
      website?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // If email is being updated, check if it's already in use
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('Email is already in use');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
    });

    // Update or create user profile if any profile fields were provided
    const profileFields = {
      phone: data.phone,
      bio: data.bio,
      website: data.website,
      streetAddress: data.streetAddress,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    };
    if (Object.values(profileFields).some((v) => v !== undefined)) {
      await prisma.userProfile.upsert({
        where: { userId },
        create: { userId, ...profileFields },
        update: profileFields,
      });
    }

    // Return updated user with profile
    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        userType: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            phone: true,
            bio: true,
            website: true,
            address: true,
            streetAddress: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
      },
    });

    return userWithProfile;
  }

  /**
   * Confirm a user's email address using the raw token from the link they
   * clicked. Tokens are single-use (cleared on success) and expire after
   * EMAIL_VERIFICATION_EXPIRY_MS.
   */
  static async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const user = await prisma.user.findUnique({ where: { emailVerificationTokenHash: tokenHash } });

    if (!user || !user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      throw new Error('Verification link is invalid or has expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiry: null,
      },
    });

    await logAuthEvent('EMAIL_VERIFIED', user.email, user.id);
  }

  /**
   * Re-issue a verification link for a signed-in user who hasn't verified yet.
   */
  static async resendVerification(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }
    await issueEmailVerificationToken(user.id, user.email);
  }

  /**
   * Same as resendVerification, but reachable without a session — for
   * someone blocked at login by an unverified email, who therefore has no
   * token to call the authenticated version with. Always resolves silently
   * (no error on unknown email / already-verified) so it can't be used to
   * enumerate registered addresses.
   */
  static async resendVerificationByEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return;
    await issueEmailVerificationToken(user.id, user.email);
  }

  /**
   * List every account currently locked (temporarily or permanently) — the
   * working set a platform admin needs to decide who to unlock.
   */
  static async listLockedAccounts() {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ permanentlyLocked: true }, { lockedUntil: { gt: new Date() } }],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lockoutCount: true,
        permanentlyLocked: true,
        lockedUntil: true,
      },
      orderBy: { lockoutCount: 'desc' },
    });
    return users;
  }

  /**
   * Administrative unlock — clears both temporary and permanent lockout
   * state. There is no self-service path to this; it's a deliberate design
   * choice for the permanent-lockout tier.
   */
  static async adminUnlockAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lockoutCount: 0,
        permanentlyLocked: false,
      },
    });
    await logAuthEvent('ACCOUNT_UNLOCKED', user.email, user.id);
  }

  // ---------------------------------------------------------------------
  // Two-factor authentication (TOTP, Google Authenticator-compatible)
  // ---------------------------------------------------------------------

  /**
   * Generates a fresh TOTP secret and stores it unactivated — 2FA only
   * takes effect once `enable2FA` confirms the user actually scanned it and
   * can produce a valid code. Calling this again before enabling just
   * replaces the pending secret (e.g. the user re-scans after a QR mishap).
   */
  static async setup2FA(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    if (user.twoFactorEnabled) throw new Error('Two-factor authentication is already enabled');

    const secret = authenticator.generateSecret();
    await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

    const otpauthUrl = authenticator.keyuri(user.email, 'Ornave', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  /**
   * Confirms setup with a real code from the authenticator app, then turns
   * 2FA on and issues a one-time set of backup codes (shown to the user
   * exactly once — only their hashes are ever stored).
   */
  static async enable2FA(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    if (user.twoFactorEnabled) throw new Error('Two-factor authentication is already enabled');
    if (!user.twoFactorSecret) throw new Error('Start setup first to get a QR code');

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new Error('Invalid code — check your authenticator app and try again');

    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex'));
    const backupCodesHash = JSON.stringify(backupCodes.map(hashToken));

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorBackupCodesHash: backupCodesHash },
    });

    await logAuthEvent('TWO_FACTOR_ENABLED', user.email, user.id);
    return { backupCodes };
  }

  /**
   * Turns 2FA off. Password-gated, same as any other security-downgrading
   * action — a stolen session cookie alone shouldn't be enough to disable it.
   */
  static async disable2FA(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

    const isPasswordValid = await PasswordManager.verifyPassword(password, user.password);
    if (!isPasswordValid) throw new Error('Incorrect password');

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodesHash: null },
    });

    await logAuthEvent('TWO_FACTOR_DISABLED', user.email, user.id);
  }

  /**
   * Completes login for a 2FA-enabled account: takes the short-lived
   * pending token from step one plus either a live TOTP code or an unused
   * backup code (which is consumed on success), and only then issues a
   * real session.
   */
  static async verifyLogin2FA(pendingToken: string, code: string, meta?: RequestMeta): Promise<AuthResponse> {
    let decoded;
    try {
      decoded = TokenManager.verifyToken(pendingToken);
    } catch {
      throw new Error('This login session has expired — please log in again');
    }
    if (!decoded.pending2FA) {
      throw new Error('This login session has expired — please log in again');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { company: true } });
    if (!user || !user.twoFactorEnabled) {
      throw new Error('This login session has expired — please log in again');
    }

    const normalizedCode = code.trim();
    let usedBackupCode = false;
    let isValid = authenticator.verify({ token: normalizedCode, secret: user.twoFactorSecret || '' });

    if (!isValid && user.twoFactorBackupCodesHash) {
      const codeHash = hashToken(normalizedCode.toLowerCase());
      const backupHashes: string[] = JSON.parse(user.twoFactorBackupCodesHash);
      if (backupHashes.includes(codeHash)) {
        isValid = true;
        usedBackupCode = true;
        const remaining = backupHashes.filter((h) => h !== codeHash);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodesHash: JSON.stringify(remaining) },
        });
      }
    }

    if (!isValid) {
      await logAuthEvent('LOGIN_FAILED', user.email, user.id, meta);
      throw new Error('Invalid or expired code');
    }

    void usedBackupCode;
    await logAuthEvent('LOGIN_SUCCESS', user.email, user.id, meta);

    const token = TokenManager.generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      userType: user.userType,
    });

    return {
      token,
      user: {
        id: user.id,
        memberNumber: user.memberNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        userType: user.userType,
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        description: user.company.description,
        industry: user.company.industry,
        createdAt: user.company.createdAt,
      } : null,
    };
  }

  // ---------------------------------------------------------------------
  // Account deletion
  // ---------------------------------------------------------------------

  /**
   * Self-service account deletion. Anonymizes rather than hard-deletes: the
   * row (and its id) stays in place so foreign-key relations — orders,
   * posts, messages, a company's employment history — remain structurally
   * valid instead of risking a cascade that destroys other parties'
   * legitimate records. PII is scrubbed and the account is deactivated.
   *
   * Blocked when the caller is the sole OWNER of a company that still has
   * other active employees — they need to transfer ownership or the company
   * would be left in a broken state.
   */
  static async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

    const isPasswordValid = await PasswordManager.verifyPassword(password, user.password);
    if (!isPasswordValid) throw new Error('Incorrect password');

    if (user.role === UserRole.OWNER && user.companyId) {
      const otherActiveEmployees = await prisma.user.count({
        where: { companyId: user.companyId, id: { not: user.id }, isActive: true, deletedAt: null },
      });
      if (otherActiveEmployees > 0) {
        throw new Error(
          'You are the owner of a company with other active members. Transfer ownership before deleting your account.'
        );
      }
    }

    // Revoke bank access immediately — unlike everything else, which waits
    // for the 30-day purge, a live credential to someone's real bank data
    // has no business staying active a moment past account deletion.
    const bankConnections = await prisma.bankConnection.findMany({ where: { userId }, select: { id: true } });
    for (const conn of bankConnections) {
      await PlaidService.removeConnection(userId, conn.id).catch((err) =>
        console.error(`[AuthService] Failed to revoke bank connection ${conn.id} on account deletion:`, err)
      );
    }

    // Same reasoning — a saved card or linked bank account is a live
    // charge-capable credential, revoked immediately rather than waiting
    // for the 30-day purge.
    await StripeService.detachAllPaymentMethods(userId).catch((err) =>
      console.error(`[AuthService] Failed to detach Stripe payment methods on account deletion:`, err)
    );

    // A deleted account shouldn't keep being billed a monthly membership —
    // cancel immediately rather than leaving it running until the 30-day
    // purge (or forever, if the account never gets purged).
    await MembershipService.cancelSubscriptionForDeletion(userId).catch((err) =>
      console.error(`[AuthService] Failed to cancel membership subscription on account deletion:`, err)
    );

    const originalEmail = user.email;
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${user.id}@deleted.ornave.local`,
        firstName: 'Deleted',
        lastName: 'User',
        password: crypto.randomBytes(32).toString('hex'),
        isActive: false,
        deletedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiry: null,
        passwordResetTokenHash: null,
        passwordResetExpiry: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodesHash: null,
      },
    });

    await logAuthEvent('ACCOUNT_DELETED', originalEmail, user.id);
  }

  // ---------------------------------------------------------------------
  // Admin: audit trail visibility
  // ---------------------------------------------------------------------

  static async listAuditLog(filters: { eventType?: string; email?: string; limit?: number }) {
    const limit = Math.min(filters.limit || 100, 500);
    return prisma.authAuditLog.findMany({
      where: {
        eventType: filters.eventType || undefined,
        email: filters.email ? { contains: filters.email, mode: 'insensitive' } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
