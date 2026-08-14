import { PrismaClient } from '@prisma/client';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

export const UserConnectionStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
} as const;

export const UserRelationshipType = {
  TENANT: 'TENANT',
  CLIENT: 'CLIENT',
  SUBSCRIBER: 'SUBSCRIBER',
  OTHER: 'OTHER',
} as const;

export interface CreateUserCompanyConnectionData {
  companyId: string;
  relationshipType?: keyof typeof UserRelationshipType;
  permissions?: Record<string, any>;
}

const COMPANY_CARD_SELECT = { id: true, name: true, slug: true, description: true, logo: true, bannerUrl: true, industry: true } as const;

export class UserCompanyConnectionService {
  /**
   * Create a connection request from a personal user to a company.
   */
  static async requestConnection(userId: string, data: CreateUserCompanyConnectionData) {
    const [user, company] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.company.findUnique({ where: { id: data.companyId } }),
    ]);

    if (!user || !company) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    const existing = await prisma.userCompanyConnection.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId: data.companyId,
        },
      },
    });

    if (existing) {
      // Re-following after a previous unfollow — reactivate the same row
      // (and its file history) instead of erroring or duplicating.
      if (existing.status === UserConnectionStatus.REVOKED) {
        return prisma.userCompanyConnection.update({
          where: { id: existing.id },
          data: { status: UserConnectionStatus.ACTIVE },
          include: { company: { select: COMPANY_CARD_SELECT } },
        });
      }
      throw new Error('Connection already exists');
    }

    // No company-side approval workflow exists for this today — a personal
    // user "following" a firm is meant to connect immediately, not sit in
    // PENDING forever with nothing anywhere able to move it to ACTIVE.
    return prisma.userCompanyConnection.create({
      data: {
        userId,
        companyId: data.companyId,
        relationshipType: data.relationshipType || UserRelationshipType.CLIENT,
        status: UserConnectionStatus.ACTIVE,
        permissions: JSON.stringify(data.permissions || {}),
      },
      include: {
        company: { select: COMPANY_CARD_SELECT },
      },
    });
  }

  /** Idempotent version of requestConnection — returns the existing
   * connection as-is if one's already ACTIVE/PENDING, reactivates a REVOKED
   * one, or creates a fresh ACTIVE one. Used when the caller just needs a
   * connection id to work with (e.g. opening a firm's detail view) and
   * doesn't care whether it already existed. */
  static async ensureConnection(userId: string, companyId: string) {
    const existing = await prisma.userCompanyConnection.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { company: { select: COMPANY_CARD_SELECT } },
    });
    if (existing) {
      if (existing.status === UserConnectionStatus.REVOKED) {
        return prisma.userCompanyConnection.update({
          where: { id: existing.id },
          data: { status: UserConnectionStatus.ACTIVE },
          include: { company: { select: COMPANY_CARD_SELECT } },
        });
      }
      return existing;
    }
    return this.requestConnection(userId, { companyId }) as any;
  }

  /** Undo a follow — a soft delete (REVOKED) rather than a hard delete so any
   * files already logged against the connection are preserved. */
  static async revoke(userId: string, companyId: string) {
    const connection = await prisma.userCompanyConnection.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!connection) throw new Error('Connection not found');
    return prisma.userCompanyConnection.update({
      where: { id: connection.id },
      data: { status: UserConnectionStatus.REVOKED },
    });
  }

  /**
   * Get all company connections for a personal user.
   */
  static async getUserConnections(userId: string) {
    return prisma.userCompanyConnection.findMany({
      where: { userId },
      include: {
        company: { select: COMPANY_CARD_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Validate active connection between a personal user and a company.
   */
  static async validateActiveConnection(userId: string, companyId: string) {
    const connection = await prisma.userCompanyConnection.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (!connection || connection.status !== UserConnectionStatus.ACTIVE) {
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }

    return connection;
  }

  /**
   * Update connection status (used by company-side approval workflows).
   */
  static async updateStatus(connectionId: string, status: keyof typeof UserConnectionStatus) {
    return prisma.userCompanyConnection.update({
      where: { id: connectionId },
      data: { status },
    });
  }

  /** Fetch a connection by id, scoped to its owner — the guard every
   * connection-detail route (files) needs before touching it. */
  static async getOwned(userId: string, connectionId: string) {
    const connection = await prisma.userCompanyConnection.findFirst({
      where: { id: connectionId, userId },
      include: { company: { select: COMPANY_CARD_SELECT } },
    });
    if (!connection) throw new Error('Connection not found');
    return connection;
  }

  /** Same guard as getOwned, but for the company side of the connection. */
  static async getOwnedByCompany(companyId: string, connectionId: string) {
    const connection = await prisma.userCompanyConnection.findFirst({
      where: { id: connectionId, companyId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!connection) throw new Error('Connection not found');
    return connection;
  }

  /** All active/pending connections a company has with personal users —
   * the client list a company sees on its side. */
  static async listForCompany(companyId: string) {
    return prisma.userCompanyConnection.findMany({
      where: { companyId, status: { not: UserConnectionStatus.REVOKED } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

export class ConnectionMessageService {
  static async list(connectionId: string) {
    return prisma.connectionMessage.findMany({ where: { connectionId }, orderBy: { createdAt: 'asc' } });
  }

  static async create(connectionId: string, senderIsCompany: boolean, content: string) {
    return prisma.connectionMessage.create({ data: { connectionId, senderIsCompany, content } });
  }
}
