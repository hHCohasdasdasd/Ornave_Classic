import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

export class NotificationService {
  /** Every real notification created (a company's reply, a ticket update, a
   * direct message, ...) also gets emailed — there's no presence/online
   * tracking in this app to gate it on, and a low-volume personal-network
   * app is exactly the case where "always email" is the right default
   * rather than something users have to discover a preference toggle for. */
  static async create(userId: string, data: { type: string; title: string; body?: string; actionRoute?: string }) {
    const notification = await prisma.notification.create({ data: { userId, ...data } });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
      const link = data.actionRoute ? `${frontendUrl}${data.actionRoute}` : frontendUrl;
      sendEmail(
        user.email,
        data.title,
        `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #14140f;">${data.title}</h2>
          ${data.body ? `<p>${data.body}</p>` : ''}
          <p><a href="${link}" style="display: inline-block; background: #c6a15b; color: #14140f; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 700;">View on Ornave</a></p>
        </div>`
      ).catch(() => {});
    }

    return notification;
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
