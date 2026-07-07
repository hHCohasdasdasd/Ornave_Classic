import bcrypt from 'bcryptjs';

/**
 * Password hashing and validation utilities
 * Ensures secure password handling across the application
 */

export class PasswordManager {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  static isPasswordStrong(password: string): boolean {
    // Minimum 8 characters, at least one uppercase, one lowercase, one digit, one special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }
}
