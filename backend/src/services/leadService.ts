import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LeadData {
  name: string;
  title?: string;
  leadCompany?: string;
  location?: string;
  industry?: string;
  connections?: number;
  mutualConnections?: string;
  saved?: boolean;
}

/**
 * Lead Service
 * Saved prospecting leads. Strictly scoped to a single company — every
 * read/write is filtered/verified by companyId, mirroring JobService.
 */
export class LeadService {
  static async listForCompany(companyId: string) {
    return prisma.lead.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(companyId: string, data: LeadData) {
    return prisma.lead.create({
      data: {
        companyId,
        name: data.name,
        title: data.title,
        leadCompany: data.leadCompany,
        location: data.location,
        industry: data.industry,
        connections: typeof data.connections === 'number' ? data.connections : undefined,
        mutualConnections: data.mutualConnections,
        saved: typeof data.saved === 'boolean' ? data.saved : undefined,
      },
    });
  }

  static async update(companyId: string, leadId: string, data: Partial<LeadData>) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.companyId !== companyId) {
      throw new Error('Unauthorized or lead not found');
    }

    return prisma.lead.update({
      where: { id: leadId },
      data: {
        name: data.name,
        title: data.title,
        leadCompany: data.leadCompany,
        location: data.location,
        industry: data.industry,
        connections: data.connections,
        mutualConnections: data.mutualConnections,
        saved: data.saved,
      },
    });
  }

  static async delete(companyId: string, leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.companyId !== companyId) {
      throw new Error('Unauthorized or lead not found');
    }
    await prisma.lead.delete({ where: { id: leadId } });
    return true;
  }
}
