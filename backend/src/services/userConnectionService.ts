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
   * Search people by name — used for @-tagging in composers. Results from
   * the searching user's own network are ranked first and flagged
   * `isConnection`, and carry enough profile detail (headline/bio/location/
   * company) for the composer to render a small preview — since two people
   * can share a name, a name match alone isn't enough to tag the right one.
   */
  static async searchUsers(query: string, limit = 8, currentUserId?: string) {
    if (!query.trim()) return [];

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: {
          select: { headline: true, bio: true, avatarUrl: true, address: true },
        },
        company: { select: { name: true } },
      },
      take: limit * 3, // over-fetch so connection-ranking still leaves `limit` results
    });

    let connectionIds = new Set<string>();
    if (currentUserId) {
      const connections = await prisma.userConnection.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
        },
        select: { requesterId: true, addresseeId: true },
      });
      connectionIds = new Set(
        connections.map((c) => (c.requesterId === currentUserId ? c.addresseeId : c.requesterId))
      );
    }

    const results = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      headline: u.profile?.headline || undefined,
      bio: u.profile?.bio || undefined,
      location: u.profile?.address || undefined,
      profilePicture: u.profile?.avatarUrl || undefined,
      companyName: u.company?.name || undefined,
      isConnection: connectionIds.has(u.id),
    }));

    results.sort((a, b) => Number(b.isConnection) - Number(a.isConnection));
    return results.slice(0, limit);
  }

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
    const [connectionCount, pendingCount, partnerCount, pendingPartnerCount] = await Promise.all([
      prisma.userConnection.count({
        where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      }),
      prisma.userConnection.count({ where: { addresseeId: userId, status: 'PENDING' } }),
      prisma.userConnection.count({
        where: { partnerStatus: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      }),
      prisma.userConnection.count({
        where: {
          partnerStatus: 'PENDING',
          partnerRequestedBy: { not: userId },
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      }),
    ]);

    return {
      connectionCount,
      pendingRequestCount: pendingCount,
      partnerCount,
      pendingPartnerRequestCount: pendingPartnerCount,
    };
  }

  // ============================================
  // PARTNERED: a deeper tier layered on top of an
  // existing ACCEPTED connection. Either connected
  // party can propose it; the other must accept.
  // ============================================

  /** Propose deepening an existing connection to "Partnered". Both users must already be connected. */
  static async requestPartnership(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new Error('Cannot partner with yourself');
    }

    const connection = await prisma.userConnection.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });

    if (!connection) {
      throw new Error('You must be connected before proposing a partnership');
    }

    if (connection.partnerStatus === 'ACCEPTED') {
      return connection;
    }

    if (connection.partnerStatus === 'PENDING' && connection.partnerRequestedBy !== userId) {
      // The other side already proposed — accept it instead of duplicating.
      return prisma.userConnection.update({
        where: { id: connection.id },
        data: { partnerStatus: 'ACCEPTED', partneredAt: new Date() },
      });
    }

    return prisma.userConnection.update({
      where: { id: connection.id },
      data: { partnerStatus: 'PENDING', partnerRequestedBy: userId },
    });
  }

  static async acceptPartnership(connectionId: string, userId: string) {
    const connection = await prisma.userConnection.findUnique({ where: { id: connectionId } });
    if (!connection || (connection.requesterId !== userId && connection.addresseeId !== userId)) {
      throw new Error('Partnership request not found');
    }
    if (connection.partnerStatus !== 'PENDING') {
      throw new Error(`Cannot accept partnership with status: ${connection.partnerStatus}`);
    }
    if (connection.partnerRequestedBy === userId) {
      throw new Error('You cannot accept your own partnership request');
    }

    return prisma.userConnection.update({
      where: { id: connectionId },
      data: { partnerStatus: 'ACCEPTED', partneredAt: new Date() },
    });
  }

  static async rejectPartnership(connectionId: string, userId: string) {
    const connection = await prisma.userConnection.findUnique({ where: { id: connectionId } });
    if (!connection || (connection.requesterId !== userId && connection.addresseeId !== userId)) {
      throw new Error('Partnership request not found');
    }
    if (connection.partnerStatus !== 'PENDING') {
      throw new Error(`Cannot reject partnership with status: ${connection.partnerStatus}`);
    }

    return prisma.userConnection.update({
      where: { id: connectionId },
      data: { partnerStatus: 'NONE', partnerRequestedBy: null },
    });
  }

  /** End a partnership (downgrade back to a regular connection). Either side may do this. */
  static async removePartnership(userId: string, otherUserId: string) {
    const connection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });
    if (!connection) return;

    await prisma.userConnection.update({
      where: { id: connection.id },
      data: { partnerStatus: 'NONE', partnerRequestedBy: null, partneredAt: null },
    });
  }

  static async getPartners(userId: string) {
    const connections = await prisma.userConnection.findMany({
      where: {
        partnerStatus: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: PROFILE_SELECT },
        addressee: { select: PROFILE_SELECT },
      },
      orderBy: { partneredAt: 'desc' },
    });

    return connections.map((c) => ({
      ...toUserProfile(c.requesterId === userId ? c.addressee : c.requester),
      partneredAt: c.partneredAt,
    }));
  }

  static async getIncomingPartnerRequests(userId: string) {
    const requests = await prisma.userConnection.findMany({
      where: {
        partnerStatus: 'PENDING',
        partnerRequestedBy: { not: userId },
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: PROFILE_SELECT },
        addressee: { select: PROFILE_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      user: toUserProfile(r.requesterId === userId ? r.addressee : r.requester),
      timestamp: r.updatedAt.toISOString(),
      status: 'pending' as const,
    }));
  }

  static async getOutgoingPartnerRequests(userId: string) {
    const requests = await prisma.userConnection.findMany({
      where: { partnerStatus: 'PENDING', partnerRequestedBy: userId },
      include: {
        requester: { select: PROFILE_SELECT },
        addressee: { select: PROFILE_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      user: toUserProfile(r.requesterId === userId ? r.addressee : r.requester),
      timestamp: r.updatedAt.toISOString(),
      status: 'pending' as const,
    }));
  }

  /** 'NOT_CONNECTED' | 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'PARTNERED' | 'SELF' */
  static async getPartnerStatus(userId: string, otherUserId: string) {
    if (userId === otherUserId) return 'SELF';

    const connection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });

    if (!connection || connection.status !== 'ACCEPTED') return 'NOT_CONNECTED';
    if (connection.partnerStatus === 'ACCEPTED') return 'PARTNERED';
    if (connection.partnerStatus === 'PENDING') {
      return connection.partnerRequestedBy === userId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
    }
    return 'NONE';
  }

  static async getPartnerCount(userId: string) {
    return prisma.userConnection.count({
      where: {
        partnerStatus: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
  }

  private static readonly SLUG_RESOLVE_SELECT = {
    id: true,
    memberNumber: true,
    firstName: true,
    lastName: true,
    email: true,
    isActive: true,
    profile: {
      select: {
        headline: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        address: true,
        website: true,
      },
    },
  } as const;

  private static formatSlugMatch(match: any) {
    return {
      id: match.id,
      memberNumber: match.memberNumber,
      firstName: match.firstName,
      lastName: match.lastName,
      email: match.email,
      headline: match.profile?.headline || undefined,
      profilePicture: match.profile?.avatarUrl || undefined,
      bannerUrl: match.profile?.bannerUrl || undefined,
      bio: match.profile?.bio || undefined,
      location: match.profile?.address || undefined,
      website: match.profile?.website || undefined,
    };
  }

  /**
   * Resolve a profile link's "view" param to a real registered user. Most
   * profile links in the app are built from a "firstname-lastname" slug
   * rather than a real user id — but that's ambiguous whenever two people
   * share a name, so callers that already know the exact user (e.g. a
   * tagged mention) should pass the real id instead, which is tried first.
   */
  static async findByNameSlug(slugOrId: string) {
    const byId = await prisma.user.findUnique({
      where: { id: slugOrId },
      select: this.SLUG_RESOLVE_SELECT,
    });
    if (byId && byId.isActive) return this.formatSlugMatch(byId);

    const normalized = slugOrId.toLowerCase().trim();
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: this.SLUG_RESOLVE_SELECT,
    });
    const match = users.find(
      (u) => `${u.firstName}-${u.lastName}`.toLowerCase() === normalized
    );
    if (!match) return null;

    return this.formatSlugMatch(match);
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
