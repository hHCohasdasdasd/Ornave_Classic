import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CompanyInvoiceData {
  description: string;
  amount: number;
  status?: string;
  invoiceDate?: string | Date;
}

/**
 * Company Billing Service
 * Platform subscription invoice history for a company. Read-mostly.
 * Strictly scoped to a single company — every read/write is filtered by
 * companyId, mirroring JobService.
 */
export class CompanyBillingService {
  static async listForCompany(companyId: string) {
    return prisma.companyInvoice.findMany({
      where: { companyId },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  static async create(companyId: string, data: CompanyInvoiceData) {
    return prisma.companyInvoice.create({
      data: {
        companyId,
        description: data.description,
        amount: data.amount,
        status: data.status,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
      },
    });
  }
}
