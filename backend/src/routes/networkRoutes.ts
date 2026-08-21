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
import { MenuItemService, RestaurantTableService, FloorPlanWallService, FloorPlanChairService, TableReservationService, AutoCheckInService, TableOrderService } from '../services/workSuiteService';
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
 * Just enough to put a name on the table-side ordering page's header — no
 * auth, no verification gate, same reasoning as the menu route below (a
 * restaurant that hasn't earned/bought the "Verified" badge yet still
 * needs its own QR ordering to work).
 */
router.get(
  '/companies/:companyId/basic-info',
  asyncHandler(async (req: Request, res: Response) => {
    const company = await TableOrderService.getCompanyBasicInfo(req.params.companyId);
    if (!company) return ApiResponseHandler.error(res, 'Company not found', undefined, 404);
    return ApiResponseHandler.success(res, company, 'Company retrieved', 200);
  })
);

/**
 * Public menu for a restaurant-layout company's profile page — no auth,
 * no verification gate (that's a separate "trust badge" concept, not a
 * requirement for a menu to be visible). Defaults to available items only
 * (the public profile's Menu tab); the table-side ordering page passes
 * ?includeUnavailable=true so it can show 86'd items as disabled/labeled
 * rather than making them vanish, which is more useful when someone's
 * actively trying to order than on a browsing/marketing page.
 */
router.get(
  '/companies/:companyId/menu',
  asyncHandler(async (req: Request, res: Response) => {
    const onlyAvailable = req.query.includeUnavailable !== 'true';
    const items = await MenuItemService.listForCompany(req.params.companyId, { onlyAvailable });
    return ApiResponseHandler.success(res, items, 'Menu retrieved', 200);
  })
);

/**
 * Public, read-only floor plan for a restaurant-layout company's profile
 * page — the saved layout built in Work Suite, shown as-is with no editing
 * affordances. Same no-auth pattern as the menu route above.
 */
router.get(
  '/companies/:companyId/floor-plan',
  asyncHandler(async (req: Request, res: Response) => {
    const [tables, chairs, walls] = await Promise.all([
      RestaurantTableService.listForCompany(req.params.companyId),
      FloorPlanChairService.listForCompany(req.params.companyId),
      FloorPlanWallService.listForCompany(req.params.companyId),
    ]);
    return ApiResponseHandler.success(res, { tables, chairs, walls }, 'Floor plan retrieved', 200);
  })
);

/**
 * Table-side ordering — the QR code on a physical table leads here, fully
 * public/no-login since whoever's sitting at the table may not be the
 * account that made the reservation. Resolves to whichever reservation is
 * active at that table right now; a table with no active reservation
 * returns null rather than an error, so the ordering page can show a plain
 * "ask staff for help" message instead of an error state.
 */
router.get(
  '/companies/:companyId/tables/:tableId/order',
  asyncHandler(async (req: Request, res: Response) => {
    const order = await TableOrderService.getOrderForTable(req.params.companyId, req.params.tableId);
    return ApiResponseHandler.success(res, order, 'Order retrieved', 200);
  })
);

router.post(
  '/companies/:companyId/tables/:tableId/order/items',
  asyncHandler(async (req: Request, res: Response) => {
    const { menuItemId, quantity, note } = req.body;
    if (!menuItemId) return ApiResponseHandler.error(res, 'menuItemId is required', undefined, 400);
    try {
      const item = await TableOrderService.addItem(req.params.companyId, req.params.tableId, { menuItemId, quantity, note });
      return ApiResponseHandler.success(res, item, 'Item added', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not add that item', undefined, err.statusCode || 400);
    }
  })
);

router.delete(
  '/companies/:companyId/tables/:tableId/order/items/:itemId',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await TableOrderService.removeItem(req.params.companyId, req.params.tableId, req.params.itemId);
      return ApiResponseHandler.success(res, {}, 'Item removed', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not remove that item', undefined, err.statusCode || 400);
    }
  })
);

/**
 * Upcoming, confirmed bookings for one table — public, no auth, so any
 * visitor picking a time slot can see what's already taken. Only exposes
 * time + party size, never who booked it.
 */
router.get(
  '/companies/:companyId/tables/:tableId/reservations',
  asyncHandler(async (req: Request, res: Response) => {
    const reservations = await TableReservationService.listUpcomingForTable(req.params.tableId, req.params.companyId);
    return ApiResponseHandler.success(res, reservations, 'Reservations retrieved', 200);
  })
);

/** Book a table for a date/time — requires a logged-in user, personal or
 * company (a company can book a table at another restaurant, just not its
 * own). */
router.post(
  '/companies/:companyId/tables/:tableId/reservations',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    try {
      const { reservationTime, partySize, note, autoCheckIn } = req.body;
      const reservation = await TableReservationService.create(
        req.user.userId, req.params.companyId, req.params.tableId,
        { reservationTime, partySize, note, autoCheckIn },
        req.user.companyId,
      );
      return ApiResponseHandler.success(res, reservation, 'Table reserved', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not create reservation', undefined, err.statusCode || 400);
    }
  })
);

/** The logged-in user's own upcoming reservations at this company — powers
 * the "My Reservations" list on the Reservation tab. */
router.get(
  '/companies/:companyId/my-reservations',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    const reservations = await TableReservationService.listUpcomingForUser(req.user.userId, req.params.companyId);
    return ApiResponseHandler.success(res, reservations, 'Reservations retrieved', 200);
  })
);

/** Cancel one of the logged-in user's own reservations. */
router.delete(
  '/reservations/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    try {
      await TableReservationService.cancel(req.user.userId, req.params.id);
      return ApiResponseHandler.success(res, {}, 'Reservation cancelled', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not cancel reservation', undefined, err.statusCode || 400);
    }
  })
);

/** One of the logged-in user's own reservations, with table/company info —
 * powers the "Automatic Check-In" panel in the calendar event modal. */
router.get(
  '/reservations/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    try {
      const reservation = await TableReservationService.getForUser(req.user.userId, req.params.id);
      return ApiResponseHandler.success(res, reservation, 'Reservation retrieved', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not retrieve reservation', undefined, err.statusCode || 400);
    }
  })
);

/** Toggle automatic check-in on one of the logged-in user's own
 * reservations — enabling it is rejected server-side (409) if they don't
 * meet the eligibility bar, regardless of what the client thinks. */
router.patch(
  '/reservations/:id/auto-check-in',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    try {
      const reservation = await AutoCheckInService.setEnabled(req.user.userId, req.params.id, !!req.body.enabled);
      return ApiResponseHandler.success(res, reservation, 'Automatic check-in updated', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not update automatic check-in', undefined, err.statusCode || 400);
    }
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
