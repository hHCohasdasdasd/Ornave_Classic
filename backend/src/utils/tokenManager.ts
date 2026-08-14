import jwt from 'jsonwebtoken';

/**
 * JWT Token generation and verification utilities
 * Handles secure token creation for authentication
 */

export interface JwtPayload {
  userId: string;
  email: string;
  companyId?: string | null;
  role: string;
  userType: string;
  /** Set only on the short-lived token issued between a correct password and
   * a confirmed TOTP/backup code — never a valid session token by itself. */
  pending2FA?: boolean;
  iat?: number;
  exp?: number;
}

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable must be set to a strong value (32+ characters) — refusing to start with a weak or missing secret.'
    );
  }
  return secret;
}

export class TokenManager {
  private static readonly SECRET = requireJwtSecret();
  private static readonly EXPIRY = process.env.JWT_EXPIRY || '7d';

  /**
   * Generate JWT token for user
   */
  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.EXPIRY as any,
    });
  }

  /**
   * Short-lived token for the gap between a correct password and a
   * confirmed 2FA code — carries `pending2FA: true` so it's rejected by
   * every normal authMiddleware-gated route.
   */
  static generatePending2FAToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'pending2FA'>): string {
    return jwt.sign({ ...payload, pending2FA: true }, this.SECRET, {
      expiresIn: '10m',
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (use with caution)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
    return null;
  }
}
