/**
 * Network Routes - Global Business Network API
 * 
 * Exposes all 5 phases:
 * 1. Directory (discovery)
 * 2. Connections (trust)
 * 3. Transactions (exchange)
 * 4. Mappings (interoperability)
 * 5. Activity (visibility)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { ApiResponseHandler } from '../utils/apiResponse';
import { GlobalDirectoryService } from '../services/globalDirectoryService';
import { ConnectionService } from '../services/connectionService';
import { GlobalTransactionService } from '../services/globalTransactionService';
import { DataMappingService } from '../services/dataMappingService';
import { ActivityStreamService } from '../services/activityStreamService';

const router = Router();

// ============================================
// PHASE 1: GLOBAL DIRECTORY
// ============================================

/**
 * Search global directory for companies
 */
router.get(
  '/directory/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { industry, country, capability, name } = req.query;

    const results = await GlobalDirectoryService.searchDirectory({
      industry: industry as string,
      country: country as string,
      capability: capability as string,
      name: name as string,
    });

    return ApiResponseHandler.success(res, results, 'Directory search completed', 200);
  })
);

/**
 * Get public company profile
 */
router.get(
  '/directory/companies/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await GlobalDirectoryService.getPublicProfile(req.params.id);
    return ApiResponseHandler.success(res, profile, 'Profile retrieved', 200);
  })
);

/**
 * Update own company profile for discoverability
 */
router.post(
  '/directory/profile',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { industry, country, capabilities, isPublicProfile, about, website } = req.body;

    const profile = await GlobalDirectoryService.updateCompanyProfile(req.user.companyId, {
      industry,
      country,
      capabilities,
      isPublicProfile,
      about,
      website,
    });

    return ApiResponseHandler.success(res, profile, 'Profile updated', 200);
  })
);

/**
 * Get directory statistics
 */
router.get(
  '/directory/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const [industries, countries] = await Promise.all([
      GlobalDirectoryService.getIndustryStats(),
      GlobalDirectoryService.getCountryStats(),
    ]);

    return ApiResponseHandler.success(
      res,
      { industries, countries },
      'Statistics retrieved',
      200
    );
  })
);

// ============================================
// PHASE 2: CONNECTIONS & PERMISSIONS
// ============================================

/**
 * Request a connection to another company
 */
router.post(
  '/connections/request',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { toCompanyId, connectionType, requestMessage } = req.body;

    const connection = await ConnectionService.sendConnectionRequest(req.user.companyId, {
      toCompanyId,
      requestMessage,
      connectionType,
    });

    return ApiResponseHandler.success(res, connection, 'Connection request sent', 201);
  })
);

/**
 * Get all connections
 */
router.get(
  '/connections',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const [incoming, outgoing, active] = await Promise.all([
      ConnectionService.getIncomingConnections(req.user.companyId),
      ConnectionService.getOutgoingConnections(req.user.companyId),
      ConnectionService.getActiveConnections(req.user.companyId),
    ]);

    return ApiResponseHandler.success(
      res,
      { incoming, outgoing, active },
      'Connections retrieved',
      200
    );
  })
);

/**
 * Accept a connection request
 */
router.post(
  '/connections/:id/accept',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const connection = await ConnectionService.acceptConnection(
      req.params.id,
      req.user.companyId
    );

    return ApiResponseHandler.success(res, connection, 'Connection accepted', 200);
  })
);

/**
 * Grant/update permissions on a connection
 */
router.post(
  '/connections/:id/permissions',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const permissions = req.body;

    const updated = await ConnectionService.grantPermissions(
      req.params.id,
      req.user.companyId,
      permissions
    );

    return ApiResponseHandler.success(res, updated, 'Permissions updated', 200);
  })
);

// ============================================
// PHASE 3: GLOBAL TRANSACTIONS
// ============================================

/**
 * Create a transaction
 */
router.post(
  '/transactions',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const transaction = await GlobalTransactionService.createTransaction(
      req.user.companyId,
      req.body
    );

    return ApiResponseHandler.success(res, transaction, 'Transaction created', 201);
  })
);

/**
 * Get transactions (sent or received)
 */
router.get(
  '/transactions',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const direction = (req.query.direction as 'sent' | 'received') || 'received';
    const transactions = await GlobalTransactionService.getTransactions(
      req.user.companyId,
      direction
    );

    return ApiResponseHandler.success(res, transactions, 'Transactions retrieved', 200);
  })
);

/**
 * Get transaction details
 */
router.get(
  '/transactions/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const transaction = await GlobalTransactionService.getTransaction(
      req.params.id,
      req.user.companyId
    );

    return ApiResponseHandler.success(res, transaction, 'Transaction retrieved', 200);
  })
);

/**
 * Send a transaction
 */
router.post(
  '/transactions/:id/send',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const transaction = await GlobalTransactionService.sendTransaction(
      req.params.id,
      req.user.companyId
    );

    return ApiResponseHandler.success(res, transaction, 'Transaction sent', 200);
  })
);

/**
 * Accept a transaction
 */
router.post(
  '/transactions/:id/accept',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { notes } = req.body;
    const transaction = await GlobalTransactionService.acceptTransaction(
      req.params.id,
      req.user.companyId,
      notes
    );

    return ApiResponseHandler.success(res, transaction, 'Transaction accepted', 200);
  })
);

/**
 * Reject a transaction
 */
router.post(
  '/transactions/:id/reject',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { reason } = req.body;
    const transaction = await GlobalTransactionService.rejectTransaction(
      req.params.id,
      req.user.companyId,
      reason
    );

    return ApiResponseHandler.success(res, transaction, 'Transaction rejected', 200);
  })
);

// ============================================
// PHASE 4: DATA MAPPING
// ============================================

/**
 * Define a module mapping
 */
router.post(
  '/mappings',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const mapping = await DataMappingService.defineModuleMapping(
      req.user.companyId,
      req.body
    );

    return ApiResponseHandler.success(res, mapping, 'Mapping defined', 201);
  })
);

/**
 * Get mappings for a company
 */
router.get(
  '/mappings',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const mappings = await DataMappingService.getCompanyMappings(req.user.companyId);

    return ApiResponseHandler.success(res, mappings, 'Mappings retrieved', 200);
  })
);

// ============================================
// PHASE 5: ACTIVITY STREAM
// ============================================

/**
 * Get activity feed
 */
router.get(
  '/activity/feed',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';

    const feed = await ActivityStreamService.getActivityFeed(req.user.companyId, {
      limit,
      offset,
      unreadOnly,
    });

    return ApiResponseHandler.success(res, feed, 'Activity feed retrieved', 200);
  })
);

/**
 * Get unread count
 */
router.get(
  '/activity/unread-count',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const count = await ActivityStreamService.getUnreadCount(req.user.companyId);

    return ApiResponseHandler.success(res, { count }, 'Unread count retrieved', 200);
  })
);

/**
 * Mark event as read
 */
router.post(
  '/activity/:id/read',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    await ActivityStreamService.markAsRead(req.params.id, req.user.companyId);

    return ApiResponseHandler.success(res, null, 'Event marked as read', 200);
  })
);

/**
 * Mark all as read
 */
router.post(
  '/activity/read-all',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    await ActivityStreamService.markAllAsRead(req.user.companyId);

    return ApiResponseHandler.success(res, null, 'All events marked as read', 200);
  })
);

export default router;
