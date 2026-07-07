import { PrismaClient } from '@prisma/client';
import { UserCompanyConnectionService } from './userCompanyConnectionService';

const prisma = new PrismaClient();

export interface CreateGlobalPaymentData {
  companyId: string;
  erpInvoiceId?: string;
  amount: number;
  status?: string;
  paymentMethod?: string;
}

export class GlobalPaymentService {
  static async createPayment(userId: string, data: CreateGlobalPaymentData) {
    await UserCompanyConnectionService.validateActiveConnection(userId, data.companyId);

    return prisma.globalPayment.create({
      data: {
        userId,
        companyId: data.companyId,
        erpInvoiceId: data.erpInvoiceId,
        amount: data.amount,
        status: data.status || 'PENDING',
        paymentMethod: data.paymentMethod,
      },
    });
  }

  static async getPayments(userId: string) {
    return prisma.globalPayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
