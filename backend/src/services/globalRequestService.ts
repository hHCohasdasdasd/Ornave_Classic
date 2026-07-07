import { PrismaClient } from '@prisma/client';
import { GlobalSyncService, GlobalRequestStatus } from './globalSyncService';
import { UserCompanyConnectionService } from './userCompanyConnectionService';

const prisma = new PrismaClient();

export interface CreateGlobalRequestData {
  companyId: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  attachedFiles?: string[];
  preferredDates?: string[];
}

export class GlobalRequestService {
  /**
   * Create a structured global request and trigger ERP automation.
   */
  static async createRequest(userId: string, data: CreateGlobalRequestData) {
    await UserCompanyConnectionService.validateActiveConnection(userId, data.companyId);

    const linkedErpObjectId = await GlobalSyncService.triggerErpObjectCreation({
      userId,
      companyId: data.companyId,
      requestType: data.type,
      title: data.title,
    });

    const statusHistory = [
      {
        status: GlobalRequestStatus.OPEN,
        timestamp: new Date().toISOString(),
        reason: 'Request created',
      },
    ];

    return prisma.globalRequest.create({
      data: {
        userId,
        companyId: data.companyId,
        type: data.type,
        title: data.title,
        description: data.description,
        metadata: JSON.stringify(data.metadata || {}),
        attachedFiles: JSON.stringify(data.attachedFiles || []),
        preferredDates: JSON.stringify(data.preferredDates || []),
        status: GlobalRequestStatus.OPEN,
        statusHistory: JSON.stringify(statusHistory),
        linkedErpObjectId,
      },
    });
  }

  /**
   * Get all requests for a personal user.
   */
  static async getRequests(userId: string) {
    return prisma.globalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single request scoped to a user.
   */
  static async getRequestById(userId: string, requestId: string) {
    const request = await prisma.globalRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new Error('Global request not found');
    }

    return request;
  }

  /**
   * Update status (typically called by ERP sync events).
   */
  static async updateStatus(requestId: string, status: string, reason?: string) {
    return GlobalSyncService.recordStatusUpdate(requestId, status, reason);
  }

  /**
   * Get recent activity items for dashboard timeline.
   */
  static async getActivity(userId: string) {
    const requests = await prisma.globalRequest.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return requests.map((request) => {
      const history = JSON.parse(request.statusHistory || '[]');
      const latest = history[history.length - 1];
      return {
        requestId: request.id,
        title: request.title,
        status: request.status,
        lastUpdate: latest?.timestamp || request.updatedAt.toISOString(),
        description: latest?.reason || 'Status updated',
      };
    });
  }
}
