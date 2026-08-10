import { Response } from 'express';
import crypto from 'crypto';

export const AUTH_COOKIE_NAME = 'ornave_token';
export const CSRF_COOKIE_NAME = 'ornave_csrf';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sets the httpOnly session cookie (unreadable by page JS — this is what
 * actually protects the session from XSS token theft) plus a matching,
 * JS-readable CSRF cookie for the double-submit pattern enforced by
 * middleware/csrf.ts.
 */
export function setAuthCookies(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });

  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}
