import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  profile: {
    select: {
      headline: true,
      avatarUrl: true,
    },
  },
} as const;

function toUserProfile(user: any) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    headline: user.profile?.headline || undefined,
    profilePicture: user.profile?.avatarUrl || undefined,
  };
}

export class UserConnectionService {
  /**
   * Send a connection request from requesterId to addresseeId.
   * If the addressee already sent a pending request to the requester, auto-accept instead
   * (mirrors how LinkedIn-style platforms resolve mutual requests).
   */
  static async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new Error('Cannot connect with yourself');
    }

    const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
    if (!addressee) {
      throw new Error('User not found');
    }

    const existing = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return existing;
      }
      if (existing.requesterId === addresseeId && existing.status === 'PENDING') {
        // The other user already requested us — accept it instead of duplicating.
        return prisma.userConnection.update({
          where: { id: existing.id },
          data: { status: 'ACCEPTED' },
        });
      }
      if (existing.status === 'REJECTED') {
        return prisma.userConnection.update({
          where: { id: existing.id },
          data: { status: 'PENDING', requesterId, addresseeId },
        });
      }
      return existing;
    }

    return prisma.userConnection.create({
      data: { requesterId, addresseeId, status: 'PENDING' },
    });
  }

  static async acceptRequest(connectionId: string, userId: string) {
    const connection = await prisma.userConnection.findUnique({ where: { id: connectionId } });
    if (!connection || connection.addresseeId !== userId) {
      throw new Error('Connection request not found');
    }
    return prisma.userConnection.update({
      where: { id: connectionId },
      data: { status: 'ACCEPTED' },
    });
  }

  static async rejectRequest(connectionId: string, userId: string) {
    const connection = await prisma.userConnection.findUnique({ where: { id: connectionId } });
    if (!connection || connection.addresseeId !== userId) {
      throw new Error('Connection request not found');
    }
    return prisma.userConnection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED' },
    });
  }

  /** Remove a connection (or cancel a pending request) between userId and otherUserId. */
  static async removeByUser(userId: string, otherUserId: string) {
    await prisma.userConnection.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });
  }

  static async getConnections(userId: string) {
    const connections = await prisma.userConnection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: PROFILE_SELECT },
        addressee: { select: PROFILE_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return connections.map((c) =>
      toUserProfile(c.requesterId === userId ? c.addressee : c.requester)
    );
  }

  static async getIncomingRequests(userId: string) {
    const requests = await prisma.userConnection.findMany({
      where: { addresseeId: userId, status: 'PENDING' },
      include: { requester: { select: PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      user: toUserProfile(r.requester),
      timestamp: r.createdAt.toISOString(),
      status: 'pending' as const,
    }));
  }

  static async getOutgoingRequests(userId: string) {
    const requests = await prisma.userConnection.findMany({
      where: { requesterId: userId, status: 'PENDING' },
      include: { addressee: { select: PROFILE_SELECT } },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      user: toUserProfile(r.addressee),
      timestamp: r.createdAt.toISOString(),
      status: 'pending' as const,
    }));
  }

  static async getStatus(userId: string, otherUserId: string) {
    if (userId === otherUserId) return 'SELF';

    const connection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });

    if (!connection) return 'NONE';
    if (connection.status === 'ACCEPTED') return 'CONNECTED';
    if (connection.status === 'PENDING') {
      return connection.requesterId === userId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
    }
    return 'NONE';
  }

  static async getStats(userId: string) {
    const [connectionCount, pendingCount] = await Promise.all([
      prisma.userConnection.count({
        where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      }),
      prisma.userConnection.count({ where: { addresseeId: userId, status: 'PENDING' } }),
    ]);

    return { connectionCount, pendingRequestCount: pendingCount };
  }

  /** Suggest other individual users not already connected/pending with the given user. */
  static async getSuggestions(userId: string, limit = 10) {
    const related = await prisma.userConnection.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });

    const excludeIds = new Set<string>([userId]);
    related.forEach((r) => {
      excludeIds.add(r.requesterId);
      excludeIds.add(r.addresseeId);
    });

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
      },
      select: PROFILE_SELECT,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(toUserProfile);
  }
}
