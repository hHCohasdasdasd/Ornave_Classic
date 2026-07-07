import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authMiddleware, companyContextMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Message Routes
 * Prefix: /api/companies/:companyId/messages
 */

// Send message
router.post(
  '/:companyId/messages',
  authMiddleware,
  companyContextMiddleware,
  MessageController.sendMessage
);

// Get received messages
router.get(
  '/:companyId/messages/received',
  authMiddleware,
  companyContextMiddleware,
  MessageController.getReceivedMessages
);

// Get sent messages
router.get(
  '/:companyId/messages/sent',
  authMiddleware,
  companyContextMiddleware,
  MessageController.getSentMessages
);

// Get unread message count
router.get(
  '/:companyId/messages/unread/count',
  authMiddleware,
  companyContextMiddleware,
  MessageController.getUnreadCount
);

// Get conversation list
router.get(
  '/:companyId/messages/conversations',
  authMiddleware,
  companyContextMiddleware,
  MessageController.getConversationList
);

// Get conversation with specific company
router.get(
  '/:companyId/messages/conversations/:otherCompanyId',
  authMiddleware,
  companyContextMiddleware,
  MessageController.getConversation
);

// Get message by ID
router.get(
  '/:companyId/messages/:messageId',
  authMiddleware,
  companyContextMiddleware,
  MessageController.getMessage
);

// Mark message as read
router.patch(
  '/:companyId/messages/:messageId/read',
  authMiddleware,
  companyContextMiddleware,
  MessageController.markAsRead
);

// Mark multiple messages as read
router.patch(
  '/:companyId/messages/read-multiple',
  authMiddleware,
  companyContextMiddleware,
  MessageController.markMultipleAsRead
);

// Delete message
router.delete(
  '/:companyId/messages/:messageId',
  authMiddleware,
  companyContextMiddleware,
  MessageController.deleteMessage
);

export default router;
