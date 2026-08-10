import { Request, Response, NextFunction } from 'express';
import { TokenManager } from '../utils/tokenManager';
import { ApiResponseHandler } from '../utils/apiResponse';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from '../utils/authCookies';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Double-submit-cookie CSRF protection.
 *
 * Only applies to requests that are actually authenticated via the httpOnly
 * session cookie — those are the ones a browser will auto-attach cross-site,
 * which is what makes CSRF possible in the first place. Requests carrying
 * their own `Authorization: Bearer` header (curl, mobile clients, future
 * non-browser API consumers) are not vulnerable to CSRF the same way, since
 * browsers never auto-attach custom headers cross-site, so they're exempt.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const hasBearerToken = !!TokenManager.extractToken(req.headers.authorization);
  if (hasBearerToken) {
    return next();
  }

  const sessionCookie = (req as any).cookies?.[AUTH_COOKIE_NAME];
  if (!sessionCookie) {
    // Not cookie-authenticated at all — let the normal auth middleware
    // handle rejecting this as unauthenticated.
    return next();
  }

  const csrfCookie = (req as any).cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    ApiResponseHandler.error(res, 'Invalid or missing CSRF token', undefined, 403);
    return;
  }

  next();
}
