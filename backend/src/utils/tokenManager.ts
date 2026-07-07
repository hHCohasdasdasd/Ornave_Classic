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
  iat?: number;
  exp?: number;
}

export class TokenManager {
  private static readonly SECRET = process.env.JWT_SECRET || 'your-secret-key';
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
