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
      const authResponse = await AuthService.login(validated as any, requestMeta(req));
      setAuthCookies(res, authResponse.token);

      return ApiResponseHandler.success(
        res,
        authResponse,
        SUCCESS_MESSAGES.AUTH_SUCCESS,
        200
      );
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
}
