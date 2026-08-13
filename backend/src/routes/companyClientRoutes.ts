import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { UserCompanyConnectionService, ConnectionMessageService } from '../services/userCompanyConnectionService';

const router = Router();

router.use(authMiddleware);

// The buyers connected to this company — the company's client list.
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can view clients', undefined, 403);
    }
    const connections = await UserCompanyConnectionService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, connections, 'Clients retrieved', 200);
  })
);

router.get(
  '/:connectionId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can view messages', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const messages = await ConnectionMessageService.list(connection.id);
    return ApiResponseHandler.success(res, messages, 'Messages retrieved', 200);
  })
);

router.post(
  '/:connectionId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can send messages', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const content = (req.body.content || '').trim();
    if (!content) return ApiResponseHandler.error(res, 'Message content is required', undefined, 400);
    const message = await ConnectionMessageService.create(connection.id, true, content);
    return ApiResponseHandler.success(res, message, 'Message sent', 201);
  })
);

export default router;
