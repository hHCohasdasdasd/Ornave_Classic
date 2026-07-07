/**
 * PHASE 3: GLOBAL TRANSACTION ENGINE
 * 
 * Implements the shared transaction protocol for B2B interactions.
 * Supports Purchase Orders, Invoices, Contracts, Shipments.
 * Each transaction must sync across both tenants simultaneously.
 * 
 * Architectural Notes:
 * - Transactions are immutable once created
 * - Status updates trigger events on both sides
 * - Line items support arbitrary data (flexible JSON)
 * - Audit trail maintains full history
 * - Transaction state is the single source of truth
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export enum GlobalTransactionType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  INVOICE = 'INVOICE',
  CONTRACT = 'CONTRACT',
  SHIPMENT = 'SHIPMENT',
  QUOTE = 'QUOTE',
  PAYMENT = 'PAYMENT',
}

export enum GlobalTransactionStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface TransactionLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  lineNumber: number;
  metadata?: Record<string, any>; // Flexible for different transaction types
}

export interface GlobalTransactionPayload {
  lineItems: TransactionLineItem[];
  totalAmount?: number;
  notes?: string;
  metadata?: Record<string, any>;
  attachments?: string[]; // URLs or file references
}

export interface CreateGlobalTransactionRequest {
  toCompanyId: string;
  connectionId: string;
  transactionType: GlobalTransactionType | string;
  senderReference?: string;
  payload: GlobalTransactionPayload;
  totalAmount?: number;
  currency?: string;
  dueDate?: Date;
  senderModuleMapping?: string;
  receiverModuleMapping?: string;
}

export class GlobalTransactionService {
  /**
   * Create a new global transaction
   * Only works between connected companies with appropriate permissions
   */
  static async createTransaction(
    fromCompanyId: string,
    request: CreateGlobalTransactionRequest
  ) {
    // Validate connection exists and is active
    const connection = await prisma.companyConnection.findUnique({
      where: { id: request.connectionId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (
      connection.fromCompanyId !== fromCompanyId ||
      connection.toCompanyId !== request.toCompanyId
    ) {
      throw new Error('Invalid connection for these companies');
    }

    if (connection.status !== 'ACCEPTED') {
      throw new Error('Connection is not active');
    }

    // Check permissions
    const hasPermission = await this.checkTransactionPermission(
      fromCompanyId,
      request.toCompanyId,
      request.transactionType
    );

    if (!hasPermission) {
      throw new Error(`No permission to create ${request.transactionType}`);
    }

    // Validate payload
    const totalAmount = this.calculateTotal(request.payload);

    // Create global reference (globally unique)
    const globalReference = `${fromCompanyId.substring(0, 4)}-${uuidv4().substring(0, 8)}`;

    // Create transaction in database
    const transaction = await prisma.globalTransaction.create({
      data: {
        fromCompanyId,
        toCompanyId: request.toCompanyId,
        connectionId: request.connectionId,
        transactionType: request.transactionType,
        senderReference: request.senderReference,
        globalReference,
        receiverReference: undefined, // Will be set by receiver
        status: GlobalTransactionStatus.DRAFT,
        payload: JSON.stringify(request.payload),
        statusHistory: JSON.stringify([
          {
            status: GlobalTransactionStatus.DRAFT,
            timestamp: new Date(),
            actor: 'SENDER',
          },
        ]),
        totalAmount: totalAmount,
        currency: request.currency || 'USD',
        dueDate: request.dueDate,
        senderModuleMapping: request.senderModuleMapping,
        receiverModuleMapping: request.receiverModuleMapping,
      },
    });

    return transaction;
  }

  /**
   * Send a transaction to the receiving company
   */
  static async sendTransaction(transactionId: string, fromCompanyId: string) {
    const transaction = await prisma.globalTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.fromCompanyId !== fromCompanyId) {
      throw new Error('Only sender can send transaction');
    }

    if (transaction.status !== GlobalTransactionStatus.DRAFT) {
      throw new Error(`Cannot send transaction with status: ${transaction.status}`);
    }

    // Update status
    const statusHistory = JSON.parse(transaction.statusHistory);
    statusHistory.push({
      status: GlobalTransactionStatus.SENT,
      timestamp: new Date(),
      actor: 'SENDER',
    });

    const updated = await prisma.globalTransaction.update({
      where: { id: transactionId },
      data: {
        status: GlobalTransactionStatus.SENT,
        statusHistory: JSON.stringify(statusHistory),
      },
    });

    // TODO: Emit event to receiving company dashboard
    return updated;
  }

  /**
   * Receive a transaction (acknowledge receipt)
   */
  static async receiveTransaction(
    transactionId: string,
    toCompanyId: string,
    receiverReference?: string
  ) {
    const transaction = await prisma.globalTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.toCompanyId !== toCompanyId) {
      throw new Error('Only receiving company can receive transaction');
    }

    if (transaction.status !== GlobalTransactionStatus.SENT) {
      throw new Error(`Cannot receive transaction with status: ${transaction.status}`);
    }

    // Update status
    const statusHistory = JSON.parse(transaction.statusHistory);
    statusHistory.push({
      status: GlobalTransactionStatus.RECEIVED,
      timestamp: new Date(),
      actor: 'RECEIVER',
    });

    const updated = await prisma.globalTransaction.update({
      where: { id: transactionId },
      data: {
        status: GlobalTransactionStatus.RECEIVED,
        receiverReference: receiverReference,
        statusHistory: JSON.stringify(statusHistory),
      },
    });

    // TODO: Emit event to sender's dashboard
    return updated;
  }

  /**
   * Accept a transaction
   */
  static async acceptTransaction(
    transactionId: string,
    companyId: string,
    notes?: string
  ) {
    const transaction = await prisma.globalTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.toCompanyId !== companyId) {
      throw new Error('Only receiving company can accept transaction');
    }

    const statusHistory = JSON.parse(transaction.statusHistory);
    statusHistory.push({
      status: GlobalTransactionStatus.ACCEPTED,
      timestamp: new Date(),
      actor: 'RECEIVER',
      notes,
    });

    return prisma.globalTransaction.update({
      where: { id: transactionId },
      data: {
        status: GlobalTransactionStatus.ACCEPTED,
        statusHistory: JSON.stringify(statusHistory),
      },
    });
  }

  /**
   * Reject a transaction
   */
  static async rejectTransaction(
    transactionId: string,
    companyId: string,
    reason: string
  ) {
    const transaction = await prisma.globalTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.toCompanyId !== companyId) {
      throw new Error('Only receiving company can reject transaction');
    }

    const statusHistory = JSON.parse(transaction.statusHistory);
    statusHistory.push({
      status: GlobalTransactionStatus.REJECTED,
      timestamp: new Date(),
      actor: 'RECEIVER',
      reason,
    });

    return prisma.globalTransaction.update({
      where: { id: transactionId },
      data: {
        status: GlobalTransactionStatus.REJECTED,
        statusHistory: JSON.stringify(statusHistory),
      },
    });
  }

  /**
   * Get transactions for a company
   */
  static async getTransactions(
    companyId: string,
    direction: 'sent' | 'received' = 'received'
  ) {
    const where =
      direction === 'sent'
        ? { fromCompanyId: companyId }
        : { toCompanyId: companyId };

    return prisma.globalTransaction.findMany({
      where,
      include: {
        fromCompany: { select: { id: true, name: true } },
        toCompany: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get transaction details
   */
  static async getTransaction(transactionId: string, companyId: string) {
    const transaction = await prisma.globalTransaction.findUnique({
      where: { id: transactionId },
      include: {
        fromCompany: { select: { id: true, name: true, slug: true } },
        toCompany: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify access
    if (
      transaction.fromCompanyId !== companyId &&
      transaction.toCompanyId !== companyId
    ) {
      throw new Error('You do not have access to this transaction');
    }

    // Parse and return
    return {
      ...transaction,
      payload: JSON.parse(transaction.payload),
      statusHistory: JSON.parse(transaction.statusHistory),
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Calculate total from line items
   */
  private static calculateTotal(payload: GlobalTransactionPayload): number {
    // If payload has explicit totalAmount, use it
    if (payload.totalAmount) {
      return payload.totalAmount;
    }
    
    // Otherwise calculate from line items if available
    if (payload.lineItems && Array.isArray(payload.lineItems)) {
      return payload.lineItems.reduce((sum, item) => sum + item.total, 0);
    }
    
    return 0;
  }

  /**
   * Check if company has permission to create this transaction type
   */
  private static async checkTransactionPermission(
    fromCompanyId: string,
    toCompanyId: string,
    transactionType: string
  ): Promise<boolean> {
    const connection = await prisma.companyConnection.findUnique({
      where: {
        fromCompanyId_toCompanyId: {
          fromCompanyId,
          toCompanyId,
        },
      },
      include: {
        permissions: {
          where: { companyId: fromCompanyId }, // Permission is FOR fromCompany
        },
      },
    });

    if (!connection || connection.status !== 'ACCEPTED') {
      return false;
    }

    const perms = connection.permissions[0];
    if (!perms) return false;

    // Map transaction types to permissions
    switch (transactionType) {
      case GlobalTransactionType.PURCHASE_ORDER:
        return perms.canCreateOrders;
      case GlobalTransactionType.INVOICE:
        return perms.canCreateInvoices;
      case GlobalTransactionType.QUOTE:
        return true; // Anyone can send quotes
      case GlobalTransactionType.SHIPMENT:
        return true; // Supplier can send shipments
      default:
        return false;
    }
  }
}
