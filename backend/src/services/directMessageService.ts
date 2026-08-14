import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_BASIC_SELECT = { id: true, firstName: true, lastName: true } as const;

export class DirectMessageService {
  /** One row per counterpart, most recently active first — the conversation
   * list. No native "group by conversation" in the schema, so this pulls
   * every message touching the user and folds it down in memory; fine at
   * the scale a personal inbox actually reaches. */
  static async listConversations(userId: string) {
    const messages = await prisma.directMessage.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: USER_BASIC_SELECT },
        toUser: { select: USER_BASIC_SELECT },
      },
    });

    const conversations = new Map<string, { counterpart: typeof messages[number]['fromUser']; lastMessage: typeof messages[number]; unreadCount: number }>();
    for (const msg of messages) {
      const counterpart = msg.fromUserId === userId ? msg.toUser : msg.fromUser;
      const existing = conversations.get(counterpart.id);
      const isUnread = msg.toUserId === userId && !msg.isRead;
      if (!existing) {
        conversations.set(counterpart.id, { counterpart, lastMessage: msg, unreadCount: isUnread ? 1 : 0 });
      } else if (isUnread) {
        existing.unreadCount += 1;
      }
    }

    return Array.from(conversations.values());
  }

  static async getThread(userId: string, otherUserId: string) {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.directMessage.updateMany({
      where: { fromUserId: otherUserId, toUserId: userId, isRead: false },
      data: { isRead: true },
    });

    return messages;
  }

  static async send(fromUserId: string, toUserId: string, content: string) {
    return prisma.directMessage.create({ data: { fromUserId, toUserId, content } });
  }

  static async getUserBasic(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });
  }
}
