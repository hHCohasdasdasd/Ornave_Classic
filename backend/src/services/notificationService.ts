import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  static async create(userId: string, data: { type: string; title: string; body?: string; actionRoute?: string }) {
    return prisma.notification.create({ data: { userId, ...data } });
  }

  static async list(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  static async markRead(userId: string, id: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}
