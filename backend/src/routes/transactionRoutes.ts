import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authMiddleware, companyContextMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Transaction Routes
 * Prefix: /api/companies/:companyId/transactions
 */

// Create transaction
router.post(
  '/:companyId/transactions',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.createTransaction
);

// Get sent transactions
router.get(
  '/:companyId/transactions/sent',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.getSentTransactions
);

// Get received transactions
router.get(
  '/:companyId/transactions/received',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.getReceivedTransactions
);

// Get transaction statistics
router.get(
  '/:companyId/transactions/stats',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.getStats
);

// Get recent transactions
router.get(
  '/:companyId/transactions/recent',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.getRecent
);

// Get transaction by reference
router.get(
  '/:companyId/transactions/reference',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.getTransactionByReference
);

// Get transaction by ID
router.get(
  '/:companyId/transactions/:transactionId',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.getTransaction
);

// Update transaction status
router.patch(
  '/:companyId/transactions/:transactionId/status',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.updateStatus
);

// Update transaction data
router.patch(
  '/:companyId/transactions/:transactionId/data',
  authMiddleware,
  companyContextMiddleware,
  TransactionController.updateData
);

export default router;
