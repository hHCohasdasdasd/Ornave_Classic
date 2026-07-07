/**
 * PHASE 5: GLOBAL ACTIVITY STREAM
 * 
 * Event-based logging for cross-company activity.
 * Companies see:
 * - Incoming connection requests
 * - Pending transactions
 * - Status changes
 * - Partner updates
 * 
 * Architectural Notes:
 * - Events are immutable and audit-ready
 * - Priority levels help with dashboard sorting
 * - Real-time capable (can integrate with WebSockets)
 * - Supports filtering and pagination for dashboards
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum ActivityEventType {
  // Connections
  CONNECTION_REQUEST_RECEIVED = 'CONNECTION_REQUEST_RECEIVED',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  CONNECTION_REJECTED = 'CONNECTION_REJECTED',
  CONNECTION_BLOCKED = 'CONNECTION_BLOCKED',

  // Transactions
  TRANSACTION_RECEIVED = 'TRANSACTION_RECEIVED',
  TRANSACTION_SENT = 'TRANSACTION_SENT',
  TRANSACTION_ACCEPTED = 'TRANSACTION_ACCEPTED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',

  // System
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  PROFILE_VERIFIED = 'PROFILE_VERIFIED',
}

export enum EventPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface CreateActivityEventRequest {
  companyId: string;
  eventType: ActivityEventType | string;
  title: string;
  description?: string;
  relatedTransactionId?: string;
  relatedCompanyId?: string;
  priority?: EventPriority;
}

export class ActivityStreamService {
  /**
   * Log an activity event
   */
  static async logEvent(event: CreateActivityEventRequest) {
    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: event.companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    return prisma.activityEvent.create({
      data: {
        companyId: event.companyId,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        relatedTransactionId: event.relatedTransactionId,
        relatedCompanyId: event.relatedCompanyId,
        priority: event.priority || EventPriority.NORMAL,
        isRead: false,
      },
    });
  }

  /**
   * Get activity feed for a company (dashboard)
   */
  static async getActivityFeed(
    companyId: string,
    {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      priority,
    }: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      priority?: EventPriority;
    } = {}
  ) {
    const where: any = { companyId };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (priority) {
      where.priority = priority;
    }

    const [events, total] = await Promise.all([
      prisma.activityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          // Include related data if exists
        },
      }),
      prisma.activityEvent.count({ where }),
    ]);

    return {
      events,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Mark event as read
   */
  static async markAsRead(eventId: string, companyId: string) {
    const event = await prisma.activityEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.companyId !== companyId) {
      throw new Error('Event not found or not yours');
    }

    return prisma.activityEvent.update({
      where: { id: eventId },
      data: { isRead: true as unknown as boolean },
    });
  }

  /**
   * Mark all events as read
   */
  static async markAllAsRead(companyId: string) {
    return prisma.activityEvent.updateMany({
      where: { companyId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(companyId: string): Promise<number> {
    return prisma.activityEvent.count({
      where: { companyId, isRead: false },
    });
  }

  /**
   * Get high-priority unread events (for notifications)
   */
  static async getUrgentEvents(companyId: string) {
    return prisma.activityEvent.findMany({
      where: {
        companyId,
        isRead: false,
        priority: { in: [EventPriority.HIGH, EventPriority.URGENT] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Delete old events (archival/cleanup)
   */
  static async deleteOldEvents(
    companyId: string,
    olderThanDays: number = 90
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.activityEvent.deleteMany({
      where: {
        companyId,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Get statistics about events
   */
  static async getEventStats(companyId: string) {
    const [total, unread, byType, byPriority] = await Promise.all([
      prisma.activityEvent.count({ where: { companyId } }),
      prisma.activityEvent.count({ where: { companyId, isRead: false } }),
      prisma.activityEvent.groupBy({
        by: ['eventType'],
        where: { companyId },
        _count: true,
      }),
      prisma.activityEvent.groupBy({
        by: ['priority'],
        where: { companyId },
        _count: true,
      }),
    ]);

    return {
      totalEvents: total,
      unreadEvents: unread,
      byType: byType.map((t) => ({ type: t.eventType, count: t._count })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
    };
  }

  // ============================================
  // HELPER: AUTO-GENERATE EVENTS
  // ============================================

  /**
   * Automatically create events for common scenarios
   */
  static async createConnectionRequestEvent(connectionId: string) {
    const connection = await prisma.companyConnection.findUnique({
      where: { id: connectionId },
      include: {
        fromCompany: true,
      },
    });

    if (!connection) return;

    // Event for receiving company
    await this.logEvent({
      companyId: connection.toCompanyId,
      eventType: ActivityEventType.CONNECTION_REQUEST_RECEIVED,
      title: `Connection request from ${connection.fromCompany.name}`,
      description: connection.requestMessage || undefined,
      relatedCompanyId: connection.fromCompanyId,
      priority: EventPriority.HIGH,
    });
  }

  /**
   * Auto-create event for incoming transaction
   */
  static async createTransactionReceivedEvent(transactionId: string) {
    const transaction = await prisma.globalTransaction.findUnique({
      where: { id: transactionId },
      include: {
        fromCompany: true,
      },
    });

    if (!transaction) return;

    await this.logEvent({
      companyId: transaction.toCompanyId,
      eventType: ActivityEventType.TRANSACTION_RECEIVED,
      title: `${transaction.transactionType} received from ${transaction.fromCompany.name}`,
      description: `Reference: ${transaction.globalReference}`,
      relatedTransactionId: transactionId,
      relatedCompanyId: transaction.fromCompanyId,
      priority: EventPriority.NORMAL,
    });
  }

  /**
   * Auto-create event for transaction status change
   */
  static async createTransactionStatusEvent(
    transactionId: string,
    newStatus: string
  ) {
    const transaction = await prisma.globalTransaction.findUnique({
      where: { id: transactionId },
      include: {
        toCompany: true,
      },
    });

    if (!transaction) return;

    const statusEventMap: Record<string, ActivityEventType> = {
      ACCEPTED: ActivityEventType.TRANSACTION_ACCEPTED,
      REJECTED: ActivityEventType.TRANSACTION_REJECTED,
      COMPLETED: ActivityEventType.TRANSACTION_COMPLETED,
    };

    const eventType = statusEventMap[newStatus] || ActivityEventType.TRANSACTION_RECEIVED;
    const priority =
      newStatus === 'REJECTED' ? EventPriority.HIGH : EventPriority.NORMAL;

    // Event for sending company
    await this.logEvent({
      companyId: transaction.fromCompanyId,
      eventType,
      title: `${transaction.transactionType} ${newStatus.toLowerCase()} by ${transaction.toCompany.name}`,
      relatedTransactionId: transactionId,
      relatedCompanyId: transaction.toCompanyId,
      priority,
    });
  }
}
