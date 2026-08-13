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
      throw new Error('Connection already exists');
    }

    return prisma.userCompanyConnection.create({
      data: {
        userId,
        companyId: data.companyId,
        relationshipType: data.relationshipType || UserRelationshipType.CLIENT,
        status: UserConnectionStatus.PENDING,
        permissions: JSON.stringify(data.permissions || {}),
      },
      include: {
        company: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Get all company connections for a personal user.
   */
  static async getUserConnections(userId: string) {
    return prisma.userCompanyConnection.findMany({
      where: { userId },
      include: {
        company: { select: { id: true, name: true, slug: true, description: true, logo: true, industry: true } },
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
}
