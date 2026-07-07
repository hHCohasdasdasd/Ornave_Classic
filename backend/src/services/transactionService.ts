import { PrismaClient } from '@prisma/client';
import { GeneratorUtils } from '../utils/generators';
import { ERROR_MESSAGES } from '../constants';

// Transaction type constants (replaced enums for SQLite compatibility)
export const TransactionType = {
  ORDER: 'ORDER',
  PAYMENT: 'PAYMENT',
  SHIPMENT: 'SHIPMENT',
  INVOICE: 'INVOICE',
  QUOTE: 'QUOTE',
  CUSTOM: 'CUSTOM',
} as const;

export const TransactionStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

const prisma = new PrismaClient();

/**
 * Transaction Service
 * Manages ERP-to-ERP transactions
 * Handles orders, payments, shipments, invoices, and custom transactions
 * Provides real-time status synchronization between companies
 */

export interface CreateTransactionData {
  toCompanyId: string;
  type: string; // TransactionType
  data: any;
  reference?: string;
}

export interface UpdateTransactionData {
  status?: string; // TransactionStatus
  data?: any;
}

export interface TransactionResponse {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  type: string;
  data: any;
  status: string;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionService {
  /**
   * Create new transaction from one company to another
   */
  static async createTransaction(
    fromCompanyId: string,
    data: CreateTransactionData
  ): Promise<TransactionResponse> {
    // Verify both companies exist
    const [fromCompany, toCompany] = await Promise.all([
      prisma.company.findUnique({ where: { id: fromCompanyId } }),
      prisma.company.findUnique({ where: { id: data.toCompanyId } }),
    ]);

    if (!fromCompany || !toCompany) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    // Verify companies are connected
    const connection = await prisma.companyConnection.findFirst({
      where: {
        OR: [
          {
            fromCompanyId,
            toCompanyId: data.toCompanyId,
            status: 'ACCEPTED',
          },
          {
            fromCompanyId: data.toCompanyId,
            toCompanyId: fromCompanyId,
            status: 'ACCEPTED',
          },
        ],
      },
    });

    if (!connection) {
      throw new Error('Companies must be connected to transact');
    }

    // Generate transaction reference
    const reference = data.reference || GeneratorUtils.generateTransactionReference();

    // Create transaction
    const transaction = await (prisma as any).globalTransaction.create({
      data: {
        fromCompanyId,
        toCompanyId: data.toCompanyId,
        type: data.type,
        data: data.data,
        status: TransactionStatus.PENDING,
        reference,
      },
    });

    return this.mapTransactionResponse(transaction);
  }

  /**
   * Get all transactions sent by company
   */
  static async getSentTransactions(
    companyId: string,
    type?: string,
    status?: string
  ): Promise<TransactionResponse[]> {
    const transactions = await (prisma as any).globalTransaction.findMany({
      where: {
        fromCompanyId: companyId,
        ...(type && { type }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(this.mapTransactionResponse);
  }

  /**
   * Get all transactions received by company
   */
  static async getReceivedTransactions(
    companyId: string,
    type?: string,
    status?: string
  ): Promise<TransactionResponse[]> {
    const transactions = await (prisma as any).globalTransaction.findMany({
      where: {
        toCompanyId: companyId,
        ...(type && { type }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(this.mapTransactionResponse);
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(
    transactionId: string,
    companyId: string
  ): Promise<TransactionResponse> {
    const transaction = await (prisma as any).globalTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify company is part of transaction
    if (transaction.fromCompanyId !== companyId && transaction.toCompanyId !== companyId) {
      throw new Error('You are not part of this transaction');
    }

    return this.mapTransactionResponse(transaction);
  }

  /**
   * Get transaction by reference
   */
  static async getTransactionByReference(
    reference: string,
    companyId: string
  ): Promise<TransactionResponse> {
    const transaction = await (prisma as any).globalTransaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify company is part of transaction
    if (transaction.fromCompanyId !== companyId && transaction.toCompanyId !== companyId) {
      throw new Error('You are not part of this transaction');
    }

    return this.mapTransactionResponse(transaction);
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    transactionId: string,
    companyId: string,
    newStatus: string
  ): Promise<TransactionResponse> {
    const transaction = await (prisma as any).globalTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify company is receiving company
    if (transaction.toCompanyId !== companyId) {
      throw new Error('Only receiving company can update transaction status');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: [TransactionStatus.ACCEPTED, TransactionStatus.REJECTED],
      ACCEPTED: [TransactionStatus.PROCESSING, TransactionStatus.REJECTED],
      REJECTED: [],
      PROCESSING: [TransactionStatus.COMPLETED, TransactionStatus.FAILED],
      COMPLETED: [],
      FAILED: [TransactionStatus.PENDING], // Can retry
    };

    if (!validTransitions[transaction.status].includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${transaction.status} to ${newStatus}`
      );
    }

    const updated = await (prisma as any).globalTransaction.update({
      where: { id: transactionId },
      data: { status: newStatus },
    });

    return this.mapTransactionResponse(updated);
  }

  /**
   * Update transaction data
   */
  static async updateTransactionData(
    transactionId: string,
    companyId: string,
    newData: any
  ): Promise<TransactionResponse> {
    const transaction = await (prisma as any).globalTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Only sender can update data
    if (transaction.fromCompanyId !== companyId) {
      throw new Error('Only sending company can update transaction data');
    }

    // Can only update if pending
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Can only update pending transactions');
    }

    const updated = await (prisma as any).globalTransaction.update({
      where: { id: transactionId },
      data: { data: newData },
    });

    return this.mapTransactionResponse(updated);
  }

  /**
   * Get transaction statistics for company
   */
  static async getTransactionStats(companyId: string): Promise<any> {
    const stats = await (prisma as any).globalTransaction.groupBy({
      by: ['status', 'type'],
      where: {
        OR: [
          { fromCompanyId: companyId },
          { toCompanyId: companyId },
        ],
      },
      _count: true,
    });

    return stats;
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(
    companyId: string,
    limit: number = 10
  ): Promise<TransactionResponse[]> {
    const transactions = await (prisma as any).globalTransaction.findMany({
      where: {
        OR: [
          { fromCompanyId: companyId },
          { toCompanyId: companyId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return transactions.map(this.mapTransactionResponse);
  }

  /**
   * Map database transaction to response format
   */
  private static mapTransactionResponse(transaction: any): TransactionResponse {
    return {
      id: transaction.id,
      fromCompanyId: transaction.fromCompanyId,
      toCompanyId: transaction.toCompanyId,
      type: transaction.type,
      data: transaction.data,
      status: transaction.status,
      reference: transaction.reference,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
