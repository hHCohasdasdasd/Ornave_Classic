import { Request, Response } from 'express';
import { MessageService } from '../services/messageService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ERROR_MESSAGES } from '../constants';
import { z } from 'zod';

/**
 * Message Controller
 * Manages company-to-company messaging
 * Send, receive, read messages between connected companies
 */

const SendMessageSchema = z.object({
  toCompanyId: z.string().min(1, 'Company ID required'),
  subject: z.string().optional(),
  content: z.string().min(1, 'Message content required'),
});

const MarkReadSchema = z.object({
  messageIds: z.array(z.string()),
});

export class MessageController {
  /**
   * Send message
   */
  static sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = SendMessageSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const message = await MessageService.sendMessage(companyId, validated as any);

      return ApiResponseHandler.success(res, message, 'Message sent', 201);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get received messages
   */
  static getReceivedMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { isRead } = req.query;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
      const messages = await MessageService.getReceivedMessages(companyId, isReadBool);

      return ApiResponseHandler.success(res, messages, 'Received messages retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get sent messages
   */
  static getSentMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const messages = await MessageService.getSentMessages(companyId);

      return ApiResponseHandler.success(res, messages, 'Sent messages retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get conversation
   */
  static getConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, otherCompanyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const messages = await MessageService.getConversation(companyId, otherCompanyId);

      return ApiResponseHandler.success(res, messages, 'Conversation retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get message by ID
   */
  static getMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, messageId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const message = await MessageService.getMessageById(messageId, companyId);

      return ApiResponseHandler.success(res, message, 'Message retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Mark message as read
   */
  static markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, messageId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const message = await MessageService.markAsRead(messageId, companyId);

      return ApiResponseHandler.success(res, message, 'Message marked as read', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Mark multiple messages as read
   */
  static markMultipleAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = MarkReadSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await MessageService.markMultipleAsRead(validated.messageIds, companyId);

      return ApiResponseHandler.success(
        res,
        null,
        'Messages marked as read',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Delete message
   */
  static deleteMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, messageId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await MessageService.deleteMessage(messageId, companyId);

      return ApiResponseHandler.success(res, null, 'Message deleted', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get unread message count
   */
  static getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const count = await MessageService.getUnreadCount(companyId);

      return ApiResponseHandler.success(res, { count }, 'Unread count retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get conversation list
   */
  static getConversationList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const conversations = await MessageService.getConversationList(companyId);

      return ApiResponseHandler.success(res, conversations, 'Conversation list retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });
}
