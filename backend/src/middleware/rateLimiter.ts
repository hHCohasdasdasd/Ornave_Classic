import rateLimit from 'express-rate-limit';

/**
 * Rate limiters for brute-force-sensitive endpoints.
 * Keyed by IP by default (express-rate-limit's standard behavior).
 */

// Login: tight limit — this is the primary brute-force / credential-stuffing target.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again later.',
  },
});

// Register: looser than login, but still bounded to slow down mass account creation.
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again later.',
  },
});

// Resend-verification (unauthenticated, by email): tight limit — the same
// endpoint an enumeration attempt or an email-bombing script would hit.
export const resendVerificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification requests. Please try again later.',
  },
});
