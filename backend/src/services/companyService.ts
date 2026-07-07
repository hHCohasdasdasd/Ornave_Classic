import { PrismaClient } from '@prisma/client';
import { GeneratorUtils } from '../utils/generators';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

/**
 * Company Service
 * Handles company creation, configuration, and multi-tenant setup
 * Each company is completely isolated with its own configuration
 */

export interface CreateCompanyData {
  name: string;
  slug?: string;
  description?: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
  companyToken: string;
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
}

export class CompanyService {
  /**
   * Create new company with isolated configuration
   * Returns unique company ID and token for API access
   */
  static async createCompany(data: CreateCompanyData): Promise<CompanyResponse> {
    // Generate slug if not provided
    const slug = data.slug || GeneratorUtils.generateSlug(data.name);

    // Validate slug format
    if (!GeneratorUtils.isValidSlug(slug)) {
      throw new Error('Invalid company slug format');
    }

    // Check if slug already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      throw new Error(ERROR_MESSAGES.COMPANY_SLUG_TAKEN);
    }

    // Generate unique company token
    const companyToken = GeneratorUtils.generateCompanyToken();

    // Create company with isolated settings
    const company = await prisma.company.create({
      data: {
        name: data.name,
        slug,
        companyToken,
        description: data.description,
        settings: {
          create: {
            customConfig: JSON.stringify({
              timezone: 'UTC',
              language: 'en',
              dateFormat: 'YYYY-MM-DD',
            }),
          },
        },
      },
    });

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      companyToken: company.companyToken,
      isPremium: company.isPremium,
      isActive: company.isActive,
      createdAt: company.createdAt,
    };
  }

  /**
   * Get company by ID with all settings
   */
  static async getCompanyById(companyId: string): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            modules: true,
            pages: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    return company;
  }

  /**
   * Get company by slug
   */
  static async getCompanyBySlug(slug: string): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: { settings: true },
    });

    if (!company) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    return company;
  }

  /**
   * Get company by token (for API authentication)
   */
  static async getCompanyByToken(token: string): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { companyToken: token },
      include: { settings: true },
    });

    if (!company) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    return company;
  }

  /**
   * Update company settings
   */
  static async updateCompanySettings(
    companyId: string,
    settings: any
  ): Promise<any> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { settings: true },
    });

    if (!company || !company.settings) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    // Update settings
    const updatedSettings = await prisma.companySettings.update({
      where: { companyId },
      data: {
        customConfig: settings.customConfig || company.settings.customConfig,
        theme: settings.theme || company.settings.theme,
      },
    });

    return updatedSettings;
  }

  /**
   * Get all users in company
   */
  static async getCompanyUsers(companyId: string): Promise<any[]> {
    return prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deactivate company
   */
  static async deactivateCompany(companyId: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: false },
    });
  }

  /**
   * Regenerate company token (security measure)
   */
  static async regenerateCompanyToken(companyId: string): Promise<string> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    const newToken = GeneratorUtils.generateCompanyToken();

    await prisma.company.update({
      where: { id: companyId },
      data: { companyToken: newToken },
    });

    return newToken;
  }
}
