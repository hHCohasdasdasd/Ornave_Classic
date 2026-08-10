import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DealData {
  name: string;
  clientCompany?: string;
  value?: number;
  stage?: string;
  owner?: string;
  closeDate?: string | Date | null;
}

/**
 * Deal Service
 * CRM sales pipeline entries. Strictly scoped to a single company — every
 * read/write is filtered/verified by companyId, mirroring JobService.
 */
export class DealService {
  static async listForCompany(companyId: string) {
    return prisma.deal.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(companyId: string, data: DealData) {
    return prisma.deal.create({
      data: {
        companyId,
        name: data.name,
        clientCompany: data.clientCompany,
        value: typeof data.value === 'number' ? data.value : undefined,
        stage: data.stage,
        owner: data.owner,
        closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
      },
    });
  }

  static async update(companyId: string, dealId: string, data: Partial<DealData>) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal || deal.companyId !== companyId) {
      throw new Error('Unauthorized or deal not found');
    }

    return prisma.deal.update({
      where: { id: dealId },
      data: {
        name: data.name,
        clientCompany: data.clientCompany,
        value: data.value,
        stage: data.stage,
        owner: data.owner,
        closeDate:
          data.closeDate === undefined
            ? undefined
            : data.closeDate
            ? new Date(data.closeDate)
            : null,
      },
    });
  }

  static async delete(companyId: string, dealId: string) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal || deal.companyId !== companyId) {
      throw new Error('Unauthorized or deal not found');
    }
    await prisma.deal.delete({ where: { id: dealId } });
    return true;
  }
}
