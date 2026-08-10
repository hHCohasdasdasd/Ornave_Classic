import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CampaignData {
  name: string;
  type?: string;
  status?: string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

/**
 * Marketing Service
 * Ad campaigns. Strictly scoped to a single company — every read/write is
 * filtered/verified by companyId, mirroring JobService.
 */
export class MarketingService {
  static async listForCompany(companyId: string) {
    return prisma.campaign.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(companyId: string, data: CampaignData) {
    return prisma.campaign.create({
      data: {
        companyId,
        name: data.name,
        type: data.type,
        status: data.status,
        budget: typeof data.budget === 'number' ? data.budget : undefined,
        spent: typeof data.spent === 'number' ? data.spent : undefined,
        impressions: typeof data.impressions === 'number' ? data.impressions : undefined,
        clicks: typeof data.clicks === 'number' ? data.clicks : undefined,
        conversions: typeof data.conversions === 'number' ? data.conversions : undefined,
      },
    });
  }

  static async update(companyId: string, campaignId: string, data: Partial<CampaignData>) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.companyId !== companyId) {
      throw new Error('Unauthorized or campaign not found');
    }

    return prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        type: data.type,
        status: data.status,
        budget: data.budget,
        spent: data.spent,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
      },
    });
  }

  static async delete(companyId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.companyId !== companyId) {
      throw new Error('Unauthorized or campaign not found');
    }
    await prisma.campaign.delete({ where: { id: campaignId } });
    return true;
  }
}
