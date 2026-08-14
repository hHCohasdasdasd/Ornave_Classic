import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { DirectMessageService } from '../services/directMessageService';
import { NotificationService } from '../services/notificationService';

const router = Router();

router.use(authMiddleware);

router.get(
  '/conversations',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const conversations = await DirectMessageService.listConversations(req.user!.userId);
    return ApiResponseHandler.success(res, conversations, 'Conversations retrieved', 200);
  })
);

// A specific person to open/start a conversation with, even before any
// messages exist — the display info the "Message" button links carry.
router.get(
  '/users/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await DirectMessageService.getUserBasic(req.params.userId);
    if (!user) return ApiResponseHandler.error(res, 'User not found', undefined, 404);
    return ApiResponseHandler.success(res, user, 'User retrieved', 200);
  })
);

router.get(
  '/conversations/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const messages = await DirectMessageService.getThread(req.user!.userId, req.params.userId);
    return ApiResponseHandler.success(res, messages, 'Thread retrieved', 200);
  })
);

router.post(
  '/conversations/:userId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const content = (req.body.content || '').trim();
    if (!content) return ApiResponseHandler.error(res, 'Message content is required', undefined, 400);
    if (req.params.userId === req.user!.userId) {
      return ApiResponseHandler.error(res, "You can't message yourself", undefined, 400);
    }
    const message = await DirectMessageService.send(req.user!.userId, req.params.userId, content);
    const sender = await DirectMessageService.getUserBasic(req.user!.userId);
    await NotificationService.create(req.params.userId, {
      type: 'direct_message',
      title: `New message from ${sender ? `${sender.firstName} ${sender.lastName}` : 'someone'}`,
      body: content.slice(0, 140),
      actionRoute: `/messages?to=${req.user!.userId}`,
    });
    return ApiResponseHandler.success(res, message, 'Message sent', 201);
  })
);

export default router;
