import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const syncEmitter = new EventEmitter();

export const GlobalRequestStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

/**
 * GlobalSyncService
 * Event-driven adapter between Ornave ERP and Ornave Global.
 * This keeps ERP sync logic decoupled from request handling.
 */
export class GlobalSyncService {
  /**
   * Subscribe to ERP status events (future event bus integration).
   */
  static onStatusUpdate(listener: (payload: any) => void) {
    syncEmitter.on('statusUpdated', listener);
  }

  /**
   * Trigger ERP object creation (stub for future ERP automation).
   */
  static async triggerErpObjectCreation(params: {
    userId: string;
    companyId: string;
    requestType: string;
    title: string;
  }) {
    const linkedErpObjectId = `ERP-${Date.now()}`;
    syncEmitter.emit('erpCreated', { ...params, linkedErpObjectId });
    return linkedErpObjectId;
  }

  /**
   * Map ERP status to GlobalRequest status.
   */
  static mapErpStatus(erpStatus: string) {
    switch (erpStatus) {
      case 'DONE':
      case 'RESOLVED':
        return GlobalRequestStatus.RESOLVED;
      case 'CLOSED':
        return GlobalRequestStatus.CLOSED;
      case 'IN_PROGRESS':
        return GlobalRequestStatus.IN_PROGRESS;
      default:
        return GlobalRequestStatus.OPEN;
    }
  }

  /**
   * Record status updates and emit events for real-time sync.
   */
  static async recordStatusUpdate(requestId: string, status: string, reason?: string) {
    const existing = await prisma.globalRequest.findUnique({ where: { id: requestId } });

    if (!existing) {
      throw new Error('Global request not found');
    }

    const history = JSON.parse(existing.statusHistory || '[]');
    history.push({ status, timestamp: new Date().toISOString(), reason });

    const updated = await prisma.globalRequest.update({
      where: { id: requestId },
      data: {
        status,
        statusHistory: JSON.stringify(history),
      },
    });

    syncEmitter.emit('statusUpdated', { requestId, status, reason });
    return updated;
  }
}
