import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { NotificationService } from '../services/notificationService';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notifications = await NotificationService.list(req.user!.userId);
    return ApiResponseHandler.success(res, notifications, 'Notifications retrieved', 200);
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await NotificationService.unreadCount(req.user!.userId);
    return ApiResponseHandler.success(res, { count }, 'Unread count retrieved', 200);
  })
);

router.post(
  '/:id/read',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await NotificationService.markRead(req.user!.userId, req.params.id);
    return ApiResponseHandler.success(res, {}, 'Notification marked read', 200);
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await NotificationService.markAllRead(req.user!.userId);
    return ApiResponseHandler.success(res, {}, 'All notifications marked read', 200);
  })
);

export default router;
