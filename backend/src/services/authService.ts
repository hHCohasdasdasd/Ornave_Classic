import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { PasswordManager } from '../utils/passwordManager';
import { TokenManager } from '../utils/tokenManager';
import { ERROR_MESSAGES } from '../constants';

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issues a fresh email-verification token for a user, stores its hash, and
 * "delivers" it. No email provider is wired up yet, so delivery is a console
 * log for now — swap this one function out once one is configured, nothing
 * else about the flow needs to change.
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
    | 'EMAIL_VERIFIED',
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
    createdAt: Date;
  } | null;
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

  static async login(credentials: LoginCredentials, meta?: RequestMeta): Promise<AuthResponse> {
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

    // Successful login — reset the failed-attempt/lock state (but not the
    // lifetime lockoutCount — escalation deliberately remembers) and update
    // last login.
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    });

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
}
