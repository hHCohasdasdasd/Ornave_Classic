import { Request, Response } from 'express';
import { ConnectionService } from '../services/connectionService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ERROR_MESSAGES } from '../constants';
import { z } from 'zod';

/**
 * Connection Controller
 * Manages B2B company connections
 * Send requests, accept/reject, view connections
 */

const CreateConnectionSchema = z.object({
  toCompanyId: z.string().min(1, 'Company ID required'),
  requestMessage: z.string().optional(),
});

const UpdateConnectionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'BLOCKED']),
});

export class ConnectionController {
  /**
   * Send connection request
   */
  static sendConnectionRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = CreateConnectionSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const connection = await ConnectionService.sendConnectionRequest(companyId, validated as any);

      return ApiResponseHandler.success(
        res,
        connection,
        'Connection request sent',
        201
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get outgoing connections
   */
  static getOutgoingConnections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { status } = req.query;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const connections = await ConnectionService.getOutgoingConnections(
        companyId,
        status as any
      );

      return ApiResponseHandler.success(res, connections, 'Outgoing connections retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get incoming connections
   */
  static getIncomingConnections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { status } = req.query;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const connections = await ConnectionService.getIncomingConnections(
        companyId,
        status as any
      );

      return ApiResponseHandler.success(res, connections, 'Incoming connections retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get active connections
   */
  static getActiveConnections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const connections = await ConnectionService.getActiveConnections(companyId);

      return ApiResponseHandler.success(res, connections, 'Active connections retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get connection details
   */
  static getConnection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, connectionId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const connection = await ConnectionService.getConnection(companyId, connectionId);

      return ApiResponseHandler.success(res, connection, 'Connection retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Accept connection
   */
  static acceptConnection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, connectionId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const connection = await ConnectionService.acceptConnection(connectionId, companyId);

      return ApiResponseHandler.success(res, connection, 'Connection accepted', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Reject connection
   */
  static rejectConnection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, connectionId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await ConnectionService.rejectConnection(connectionId, companyId);

      return ApiResponseHandler.success(res, null, 'Connection rejected', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Block connection
   */
  static blockConnection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, connectionId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await ConnectionService.blockConnection(connectionId, companyId);

      return ApiResponseHandler.success(res, null, 'Connection blocked', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get pending connection count
   */
  static getPendingCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const count = await ConnectionService.getPendingConnectionCount(companyId);

      return ApiResponseHandler.success(res, { count }, 'Pending count retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });
}
