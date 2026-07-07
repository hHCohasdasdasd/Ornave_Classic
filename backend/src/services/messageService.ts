import { PrismaClient } from '@prisma/client';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

/**
 * Message Service
 * Manages company-to-company messaging
 * Secure communication between connected companies
 */

export interface CreateMessageData {
  toCompanyId: string;
  subject?: string;
  content: string;
}

export interface MessageResponse {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  subject?: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export class MessageService {
  /**
   * Send message from one company to another
   */
  static async sendMessage(
    fromCompanyId: string,
    data: CreateMessageData
  ): Promise<MessageResponse> {
    // Verify to company exists
    const toCompany = await prisma.company.findUnique({
      where: { id: data.toCompanyId },
    });

    if (!toCompany) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    // Verify companies are connected
    const connection = await prisma.companyConnection.findFirst({
      where: {
        OR: [
          {
            fromCompanyId,
            toCompanyId: data.toCompanyId,
            status: 'ACCEPTED',
          },
          {
            fromCompanyId: data.toCompanyId,
            toCompanyId: fromCompanyId,
            status: 'ACCEPTED',
          },
        ],
      },
    });

    if (!connection) {
      throw new Error('Companies must be connected to message each other');
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        fromCompanyId,
        toCompanyId: data.toCompanyId,
        subject: data.subject,
        content: data.content,
        isRead: false,
      },
    });

    return this.mapMessageResponse(message);
  }

  /**
   * Get all messages received by company
   */
  static async getReceivedMessages(
    companyId: string,
    isRead?: boolean
  ): Promise<MessageResponse[]> {
    const messages = await prisma.message.findMany({
      where: {
        toCompanyId: companyId,
        ...(isRead !== undefined && { isRead }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map(this.mapMessageResponse);
  }

  /**
   * Get all messages sent by company
   */
  static async getSentMessages(companyId: string): Promise<MessageResponse[]> {
    const messages = await prisma.message.findMany({
      where: { fromCompanyId: companyId },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map(this.mapMessageResponse);
  }

  /**
   * Get conversation between two companies
   */
  static async getConversation(
    companyId: string,
    otherCompanyId: string
  ): Promise<MessageResponse[]> {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            fromCompanyId: companyId,
            toCompanyId: otherCompanyId,
          },
          {
            fromCompanyId: otherCompanyId,
            toCompanyId: companyId,
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(this.mapMessageResponse);
  }

  /**
   * Get message by ID
   */
  static async getMessageById(
    messageId: string,
    companyId: string
  ): Promise<MessageResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Verify company is part of conversation
    if (message.fromCompanyId !== companyId && message.toCompanyId !== companyId) {
      throw new Error('You are not part of this conversation');
    }

    return this.mapMessageResponse(message);
  }

  /**
   * Mark message as read
   */
  static async markAsRead(
    messageId: string,
    companyId: string
  ): Promise<MessageResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only recipient can mark as read
    if (message.toCompanyId !== companyId) {
      throw new Error('Only message recipient can mark as read');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return this.mapMessageResponse(updated);
  }

  /**
   * Mark multiple messages as read
   */
  static async markMultipleAsRead(
    messageIds: string[],
    companyId: string
  ): Promise<void> {
    // Verify all messages belong to company as recipient
    const messages = await prisma.message.findMany({
      where: { id: { in: messageIds } },
    });

    for (const msg of messages) {
      if (msg.toCompanyId !== companyId) {
        throw new Error('You can only mark your own messages as read');
      }
    }

    // Mark all as read
    await prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { isRead: true },
    });
  }

  /**
   * Delete message (soft delete - can implement as needed)
   */
  static async deleteMessage(
    messageId: string,
    companyId: string
  ): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Either party can delete
    if (message.fromCompanyId !== companyId && message.toCompanyId !== companyId) {
      throw new Error('You are not part of this conversation');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(companyId: string): Promise<number> {
    return prisma.message.count({
      where: {
        toCompanyId: companyId,
        isRead: false,
      },
    });
  }

  /**
   * Get conversation list (latest message with each company)
   */
  static async getConversationList(companyId: string): Promise<any[]> {
    const conversationIds = await prisma.message.findMany({
      where: {
        OR: [
          { fromCompanyId: companyId },
          { toCompanyId: companyId },
        ],
      },
      distinct: ['fromCompanyId', 'toCompanyId'],
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const conversations = [];
    const seenPairs = new Set();

    for (const msg of conversationIds) {
      const otherCompanyId =
        msg.fromCompanyId === companyId ? msg.toCompanyId : msg.fromCompanyId;
      const pairKey = [companyId, otherCompanyId].sort().join('-');

      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      // Get company details
      const otherCompany = await prisma.company.findUnique({
        where: { id: otherCompanyId },
        select: { id: true, name: true, slug: true },
      });

      // Get latest message
      const latestMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { fromCompanyId: companyId, toCompanyId: otherCompanyId },
            { fromCompanyId: otherCompanyId, toCompanyId: companyId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      conversations.push({
        otherCompany,
        lastMessage: latestMessage ? this.mapMessageResponse(latestMessage) : null,
      });
    }

    return conversations;
  }

  /**
   * Map database message to response format
   */
  private static mapMessageResponse(message: any): MessageResponse {
    return {
      id: message.id,
      fromCompanyId: message.fromCompanyId,
      toCompanyId: message.toCompanyId,
      subject: message.subject,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }
}
