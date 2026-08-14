import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { PasswordManager } from '../utils/passwordManager';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { setAuthCookies, clearAuthCookies } from '../utils/authCookies';
import { z } from 'zod';

function requestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

/**
 * Authentication Controller
 * Handles login, registration, and token management
 */

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required'),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  companyId: z.string().min(1, 'Company ID required').optional(),
  companyName: z.string().min(1, 'Company name required').optional(),
  userType: z.enum(['USER', 'COMPANY_USER']).optional(),
});

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const VerifyLogin2FASchema = z.object({
  pendingToken: z.string().min(1, 'Pending token required'),
  code: z.string().min(1, 'Code required'),
});

const Enable2FASchema = z.object({
  code: z.string().min(1, 'Code required'),
});

const Disable2FASchema = z.object({
  password: z.string().min(1, 'Password required'),
});

const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password required'),
});

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name required').optional(),
  lastName: z.string().min(1, 'Last name required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export class AuthController {
  /**
   * Register new user
   * User must belong to a company
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    try {
      const validated = RegisterSchema.parse(req.body);

      if (validated.userType !== 'USER' && !validated.companyId && !validated.companyName) {
        return ApiResponseHandler.error(
          res,
          'Either companyId or companyName must be provided for company accounts',
          'Missing company details',
          400
        );
      }

      // Check password strength
      if (!PasswordManager.isPasswordStrong(validated.password)) {
        return ApiResponseHandler.error(
          res,
          'Password must contain uppercase, lowercase, number, and special character',
          'Weak password',
          400
        );
      }

      const authResponse = await AuthService.register(validated as any, requestMeta(req));
      setAuthCookies(res, authResponse.token);

      return ApiResponseHandler.success(
        res,
        authResponse,
        SUCCESS_MESSAGES.USER_CREATED,
        201
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    try {
      const validated = LoginSchema.parse(req.body);
      const result = await AuthService.login(validated as any, requestMeta(req));

      if ('pending2FA' in result) {
        return ApiResponseHandler.success(res, result, 'Two-factor code required', 200);
      }

      setAuthCookies(res, result.token);
      return ApiResponseHandler.success(
        res,
        result,
        SUCCESS_MESSAGES.AUTH_SUCCESS,
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 401);
    }
  });

  /**
   * Completes login for a 2FA-enabled account using the pending token from
   * the first login step plus a TOTP or backup code.
   */
  static verifyLogin2FA = asyncHandler(async (req: Request, res: Response) => {
    try {
      const validated = VerifyLogin2FASchema.parse(req.body);
      const authResponse = await AuthService.verifyLogin2FA(validated.pendingToken, validated.code, requestMeta(req));
      setAuthCookies(res, authResponse.token);

      return ApiResponseHandler.success(res, authResponse, SUCCESS_MESSAGES.AUTH_SUCCESS, 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 401);
    }
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      }

      const user = await AuthService.getUserById(req.user.userId);
      return ApiResponseHandler.success(res, user, 'Profile retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      }

      const validated = ChangePasswordSchema.parse(req.body);
      await AuthService.changePassword(req.user.userId, validated.oldPassword, validated.newPassword, requestMeta(req));

      return ApiResponseHandler.success(
        res,
        null,
        'Password changed successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Request a password-reset link — always reports success, whether or not
   * the email is actually registered, so this can't be used to enumerate
   * accounts.
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const validated = ForgotPasswordSchema.parse(req.body);
      await AuthService.forgotPassword(validated.email);
    } catch {
      // Fall through to the same generic response either way.
    }
    return ApiResponseHandler.success(res, null, 'If that email is registered, a reset link has been sent.', 200);
  });

  /**
   * Complete a password reset from the token in the emailed link.
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const validated = ResetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(validated.token, validated.newPassword);
      return ApiResponseHandler.success(res, null, 'Password reset successfully', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      }

      const validated = UpdateProfileSchema.parse(req.body);
      const updatedUser = await AuthService.updateProfile(req.user.userId, validated);

      return ApiResponseHandler.success(
        res,
        updatedUser,
        'Profile updated successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Logout — clears the httpOnly session cookie. (Bearer-token clients have
   * nothing server-side to clear; they just discard the token locally.)
   */
  static logout = asyncHandler(async (_req: Request, res: Response) => {
    clearAuthCookies(res);
    return ApiResponseHandler.success(res, null, 'Logged out successfully', 200);
  });

  /**
   * Verify email address from a link token
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : undefined;
      if (!token) {
        return ApiResponseHandler.error(res, 'Verification token is required', undefined, 400);
      }
      await AuthService.verifyEmail(token);
      return ApiResponseHandler.success(res, null, 'Email verified successfully', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Resend a verification link to the signed-in (but unverified) user
   */
  static resendVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      }
      await AuthService.resendVerification(req.user.userId);
      return ApiResponseHandler.success(res, null, 'Verification email sent', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Resend a verification link by email — for someone blocked at login with
   * no session to call the authenticated version. Always reports success.
   */
  static resendVerificationByEmail = asyncHandler(async (req: Request, res: Response) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    if (email) {
      await AuthService.resendVerificationByEmail(email);
    }
    return ApiResponseHandler.success(res, null, 'If that email is registered and unverified, a new link has been sent.', 200);
  });

  /**
   * Verify token
   */
  static verifyToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.INVALID_TOKEN, undefined, 401);
      }

      return ApiResponseHandler.success(
        res,
        { valid: true, user: req.user },
        'Token is valid',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 401);
    }
  });

  /**
   * [Platform admin only] List currently locked accounts
   */
  static listLockedAccounts = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const locked = await AuthService.listLockedAccounts();
    return ApiResponseHandler.success(res, locked, 'Locked accounts retrieved', 200);
  });

  /**
   * [Platform admin only] Unlock a specific account
   */
  static adminUnlockAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      await AuthService.adminUnlockAccount(req.params.userId);
      return ApiResponseHandler.success(res, null, 'Account unlocked successfully', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Begin 2FA setup: returns a fresh TOTP secret + QR code. Not yet active
   * until confirmed via enable2FA.
   */
  static setup2FA = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      const result = await AuthService.setup2FA(req.user.userId);
      return ApiResponseHandler.success(res, result, '2FA setup started', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  static enable2FA = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      const validated = Enable2FASchema.parse(req.body);
      const result = await AuthService.enable2FA(req.user.userId, validated.code);
      return ApiResponseHandler.success(res, result, 'Two-factor authentication enabled', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  static disable2FA = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      const validated = Disable2FASchema.parse(req.body);
      await AuthService.disable2FA(req.user.userId, validated.password);
      return ApiResponseHandler.success(res, null, 'Two-factor authentication disabled', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Self-service account deletion (anonymization-based). Clears session
   * cookies on success since the account is no longer usable.
   */
  static deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      const validated = DeleteAccountSchema.parse(req.body);
      await AuthService.deleteAccount(req.user.userId, validated.password);
      clearAuthCookies(res);
      return ApiResponseHandler.success(res, null, 'Account deleted', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * [Platform admin only] List/filter auth audit log entries.
   */
  static listAuditLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const eventType = typeof req.query.eventType === 'string' ? req.query.eventType : undefined;
    const email = typeof req.query.email === 'string' ? req.query.email : undefined;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const entries = await AuthService.listAuditLog({ eventType, email, limit });
    return ApiResponseHandler.success(res, entries, 'Audit log retrieved', 200);
  });
}
