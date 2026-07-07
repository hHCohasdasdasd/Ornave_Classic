import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ERROR_MESSAGES } from '../constants';
import { z } from 'zod';

/**
 * Transaction Controller
 * Manages ERP-to-ERP transactions
 * Create orders, payments, shipments, etc with status tracking
 */

const CreateTransactionSchema = z.object({
  toCompanyId: z.string().min(1, 'Company ID required'),
  type: z.enum(['ORDER', 'PAYMENT', 'SHIPMENT', 'INVOICE', 'QUOTE', 'CUSTOM']),
  data: z.object({}).passthrough(),
  reference: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED']),
});

const UpdateDataSchema = z.object({
  data: z.object({}).passthrough(),
});

export class TransactionController {
  /**
   * Create transaction
   */
  static createTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = CreateTransactionSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transaction = await TransactionService.createTransaction(companyId, validated as any);

      return ApiResponseHandler.success(
        res,
        transaction,
        'Transaction created',
        201
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get sent transactions
   */
  static getSentTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { type, status } = req.query;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transactions = await TransactionService.getSentTransactions(
        companyId,
        type as any,
        status as any
      );

      return ApiResponseHandler.success(res, transactions, 'Sent transactions retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get received transactions
   */
  static getReceivedTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { type, status } = req.query;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transactions = await TransactionService.getReceivedTransactions(
        companyId,
        type as any,
        status as any
      );

      return ApiResponseHandler.success(res, transactions, 'Received transactions retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get transaction by ID
   */
  static getTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, transactionId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transaction = await TransactionService.getTransactionById(transactionId, companyId);

      return ApiResponseHandler.success(res, transaction, 'Transaction retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Get transaction by reference
   */
  static getTransactionByReference = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { reference } = req.query;

      if (!reference) {
        return ApiResponseHandler.error(res, 'Reference required', undefined, 400);
      }

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transaction = await TransactionService.getTransactionByReference(
        reference as string,
        companyId
      );

      return ApiResponseHandler.success(res, transaction, 'Transaction retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Update transaction status
   */
  static updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, transactionId } = req.params;
      const validated = UpdateStatusSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transaction = await TransactionService.updateTransactionStatus(
        transactionId,
        companyId,
        validated.status as any
      );

      return ApiResponseHandler.success(res, transaction, 'Transaction status updated', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Update transaction data
   */
  static updateData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, transactionId } = req.params;
      const validated = UpdateDataSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transaction = await TransactionService.updateTransactionData(
        transactionId,
        companyId,
        validated.data
      );

      return ApiResponseHandler.success(res, transaction, 'Transaction data updated', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get transaction statistics
   */
  static getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const stats = await TransactionService.getTransactionStats(companyId);

      return ApiResponseHandler.success(res, stats, 'Transaction stats retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get recent transactions
   */
  static getRecent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { limit } = req.query;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const transactions = await TransactionService.getRecentTransactions(
        companyId,
        limit ? parseInt(limit as string) : 10
      );

      return ApiResponseHandler.success(res, transactions, 'Recent transactions retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });
}
