import { Request, Response, NextFunction } from 'express';
import { TokenManager, JwtPayload } from '../utils/tokenManager';
import { ApiResponseHandler } from '../utils/apiResponse';
import { ERROR_MESSAGES } from '../constants';

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  companyId?: string;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = TokenManager.extractToken(authHeader);

    if (!token) {
      ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
      return;
    }

    const decoded = TokenManager.verifyToken(token);
    req.user = decoded;
    req.companyId = decoded.companyId || undefined;

    next();
  } catch (error) {
    ApiResponseHandler.error(res, ERROR_MESSAGES.INVALID_TOKEN, undefined, 401);
  }
}

/**
 * Optional authentication middleware
 * Decodes the token and attaches user data when present, but never rejects
 * the request — for endpoints that are publicly readable but personalize
 * their response (e.g. "isMember") when the caller happens to be signed in.
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = TokenManager.extractToken(req.headers.authorization);
    if (token) {
      const decoded = TokenManager.verifyToken(token);
      req.user = decoded;
      req.companyId = decoded.companyId || undefined;
    }
  } catch {
    // Invalid/expired token on an optional-auth route — proceed as a guest.
  }
  next();
}

/**
 * Role-based access control middleware
 * Restricts access based on user role
 */
export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      return;
    }
    next();
  };
}

/**
 * User type middleware
 * Restricts access based on account type (USER | COMPANY_USER)
 */
export function userTypeMiddleware(...allowedTypes: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedTypes.includes(req.user.userType)) {
      ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      return;
    }
    next();
  };
}

/**
 * Company context middleware
 * Ensures user belongs to the company they're accessing
 */
export function companyContextMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { companyId } = req.params;

  if (!req.user) {
    ApiResponseHandler.error(res, ERROR_MESSAGES.UNAUTHORIZED, undefined, 401);
    return;
  }

  if (!req.user.companyId) {
    ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
    return;
  }

  if (req.user.companyId !== companyId) {
    ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
    return;
  }

  next();
}
