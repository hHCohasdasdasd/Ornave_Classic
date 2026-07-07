/**
 * PHASE 1: GLOBAL DIRECTORY SERVICE
 * 
 * Enables companies to discover each other in a global B2B network.
 * Maintains public company profiles while enforcing data isolation.
 * 
 * Architectural Notes:
 * - Companies control their own visibility and capabilities
 * - Search is read-only and doesn't leak sensitive data
 * - Verification layer prevents fraudulent profiles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CompanySearchFilter {
  industry?: string;
  country?: string;
  capability?: string; // Searches in capabilities array
  name?: string;
  verified?: boolean;
}

export class GlobalDirectoryService {
  /**
   * Update company profile for global discoverability
   */
  static async updateCompanyProfile(
    companyId: string,
    data: {
      industry?: string;
      country?: string;
      capabilities?: string[];
      isPublicProfile?: boolean;
      about?: string;
      website?: string;
    }
  ) {
    // Ensure company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Create or update profile
    const profile = await prisma.companyProfile.upsert({
      where: { companyId },
      create: {
        companyId,
        industry: data.industry,
        country: data.country,
        capabilities: JSON.stringify(data.capabilities || []),
        about: data.about,
        website: data.website,
      },
      update: {
        industry: data.industry,
        country: data.country,
        capabilities: JSON.stringify(data.capabilities || []),
        about: data.about,
        website: data.website,
      },
    });

    // Update company visibility
    if (data.isPublicProfile !== undefined) {
      await prisma.company.update({
        where: { id: companyId },
        data: { isPublicProfile: data.isPublicProfile },
      });
    }

    return profile;
  }

  /**
   * Search the global directory for companies
   * Only returns public profiles
   */
  static async searchDirectory(filters: CompanySearchFilter, limit: number = 20) {
    const where: any = {};

    // Apply filters
    if (filters.industry) {
      where.industry = filters.industry;
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.verified) {
      where.verificationStatus = 'VERIFIED';
    }

    const results = await prisma.companyProfile.findMany({
      where: {
        ...where,
        company: {
          isPublicProfile: true,
          isActive: true,
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logo: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
      take: limit,
    });

    // If searching by capability, filter in memory (JSON search is complex in SQLite)
    if (filters.capability) {
      return results.filter((profile) => {
        const capabilities = JSON.parse(profile.capabilities);
        return capabilities.includes(filters.capability);
      });
    }

    // Filter by name if provided
    if (filters.name) {
      return results.filter((profile) =>
        profile.company.name.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }

    return results;
  }

  /**
   * Get a public company profile
   */
  static async getPublicProfile(companyId: string) {
    const profile = await prisma.companyProfile.findUnique({
      where: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logo: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
    });

    // Check if profile is publicly visible
    if (!profile || !profile.company.isVerified) {
      throw new Error('Company profile not found or not verified');
    }

    return profile;
  }

  /**
   * Get industry statistics (for UI/analytics)
   */
  static async getIndustryStats() {
    const stats = await prisma.companyProfile.groupBy({
      by: ['industry'],
      _count: true,
    });

    return stats.map((stat) => ({
      industry: stat.industry,
      count: stat._count,
    }));
  }

  /**
   * Get country statistics (for UI/analytics)
   */
  static async getCountryStats() {
    const stats = await prisma.companyProfile.groupBy({
      by: ['country'],
      _count: true,
    });

    return stats.map((stat) => ({
      country: stat.country,
      count: stat._count,
    }));
  }
}
