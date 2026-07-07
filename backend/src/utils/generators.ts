import { v4 as uuidv4 } from 'uuid';

/**
 * Utility functions for generating slugs, tokens, and identifiers
 */

export class GeneratorUtils {
  /**
   * Generate URL-friendly slug from text
   */
  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate unique company token
   * Format: orn_[uuid]
   */
  static generateCompanyToken(): string {
    return `orn_${uuidv4().replace(/-/g, '')}`;
  }

  /**
   * Generate transaction reference number
   * Format: TRX_[timestamp]_[random]
   */
  static generateTransactionReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRX_${timestamp}_${random}`;
  }

  /**
   * Validate slug format
   */
  static isValidSlug(slug: string): boolean {
    const regex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    return regex.test(slug) && slug.length > 0;
  }
}
