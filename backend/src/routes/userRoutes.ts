import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserConnectionService } from '../services/userConnectionService';
import { ApiResponseHandler } from '../utils/apiResponse';

export const userRoutes = Router();

/**
 * Suggested people to connect with
 * GET /api/users/discover
 */
userRoutes.get(
  '/discover',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const suggestions = await UserConnectionService.getSuggestions(req.user!.userId, limit);
    return ApiResponseHandler.success(res, suggestions, 'Suggestions retrieved successfully', 200);
  })
);

/**
 * Accepted connections
 * GET /api/users/connections
 */
userRoutes.get(
  '/connections',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const connections = await UserConnectionService.getConnections(req.user!.userId);
    return ApiResponseHandler.success(res, connections, 'Connections retrieved successfully', 200);
  })
);

/**
 * Connection stats (counts only — cheap for navbar badges)
 * GET /api/users/connections/stats
 */
userRoutes.get(
  '/connections/stats',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await UserConnectionService.getStats(req.user!.userId);
    return ApiResponseHandler.success(res, stats, 'Stats retrieved successfully', 200);
  })
);

/**
 * Incoming pending requests
 * GET /api/users/connections/requests
 */
userRoutes.get(
  '/connections/requests',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const requests = await UserConnectionService.getIncomingRequests(req.user!.userId);
    return ApiResponseHandler.success(res, requests, 'Requests retrieved successfully', 200);
  })
);

/**
 * Outgoing pending requests
 * GET /api/users/connections/sent
 */
userRoutes.get(
  '/connections/sent',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const requests = await UserConnectionService.getOutgoingRequests(req.user!.userId);
    return ApiResponseHandler.success(res, requests, 'Sent requests retrieved successfully', 200);
  })
);

/**
 * Connection status with a specific user
 * GET /api/users/connections/status/:userId
 */
userRoutes.get(
  '/connections/status/:userId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const status = await UserConnectionService.getStatus(req.user!.userId, req.params.userId);
    return ApiResponseHandler.success(res, { status }, 'Status retrieved successfully', 200);
  })
);

/**
 * Send a connection request to a user
 * POST /api/users/connections/:userId/request
 */
userRoutes.post(
  '/connections/:userId/request',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const connection = await UserConnectionService.sendRequest(req.user!.userId, req.params.userId);
    return ApiResponseHandler.success(res, connection, 'Connection request sent', 201);
  })
);

/**
 * Accept a connection request
 * POST /api/users/connections/:connectionId/accept
 */
userRoutes.post(
  '/connections/:connectionId/accept',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const connection = await UserConnectionService.acceptRequest(
      req.params.connectionId,
      req.user!.userId
    );
    return ApiResponseHandler.success(res, connection, 'Connection accepted', 200);
  })
);

/**
 * Reject a connection request
 * POST /api/users/connections/:connectionId/reject
 */
userRoutes.post(
  '/connections/:connectionId/reject',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const connection = await UserConnectionService.rejectRequest(
      req.params.connectionId,
      req.user!.userId
    );
    return ApiResponseHandler.success(res, connection, 'Connection rejected', 200);
  })
);

/**
 * Remove a connection (or cancel a pending request) with a user
 * DELETE /api/users/connections/by-user/:userId
 */
userRoutes.delete(
  '/connections/by-user/:userId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await UserConnectionService.removeByUser(req.user!.userId, req.params.userId);
    return ApiResponseHandler.success(res, {}, 'Connection removed', 200);
  })
);

export default userRoutes;
