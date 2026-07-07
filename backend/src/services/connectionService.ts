import { PrismaClient } from '@prisma/client';
import { ERROR_MESSAGES } from '../constants';

/**
 * PHASE 2: CONNECTION MANAGEMENT SERVICE (ENHANCED)
 * 
 * Manages B2B connections with granular permission layers.
 * Each connection type (supplier, client, partner) has different permission implications.
 * 
 * Architectural Notes:
 * - Connections are directional (from → to)
 * - Permissions are granular and extensible per-connection
 * - Connection status must be synchronized across tenants
 * - No data is shared until connection is ACCEPTED
 * - This service keeps existing API compatibility while adding new capabilities
 */

// Connection status constants (replaced enums for SQLite compatibility)
export const ConnectionStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
} as const;

// Connection types for B2B relationships
export const ConnectionType = {
  SUPPLIER: 'SUPPLIER',
  CLIENT: 'CLIENT',
  PARTNER: 'PARTNER',
  GROUP_ENTITY: 'GROUP_ENTITY',
} as const;

const prisma = new PrismaClient();

export interface CreateConnectionRequestData {
  toCompanyId: string;
  requestMessage?: string;
  connectionType?: keyof typeof ConnectionType; // NEW: specify relationship type
}

export interface ConnectionResponse {
  id: string;
  fromCompanyId: string;
  fromCompany: {
    id: string;
    name: string;
    slug: string;
  };
  toCompanyId: string;
  toCompany: {
    id: string;
    name: string;
    slug: string;
  };
  status: string;
  connectionType?: string; // NEW: relationship type
  requestMessage?: string;
  connectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// NEW: Permission set interface
export interface PermissionSet {
  canViewInventory?: boolean;
  canCreateOrders?: boolean;
  canViewOrders?: boolean;
  canCreateInvoices?: boolean;
  canViewInvoices?: boolean;
  canAccessPricing?: boolean;
  canReceiveMessages?: boolean;
  customPermissions?: Record<string, any>;
}

export class ConnectionService {
  /**
   * Send connection request from one company to another
   */
  static async sendConnectionRequest(
    fromCompanyId: string,
    data: CreateConnectionRequestData
  ): Promise<ConnectionResponse> {
    // Verify both companies exist
    const [fromCompany, toCompany] = await Promise.all([
      prisma.company.findUnique({ where: { id: fromCompanyId } }),
      prisma.company.findUnique({ where: { id: data.toCompanyId } }),
    ]);

    if (!fromCompany || !toCompany) {
      throw new Error(ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    // Check if connection already exists
    const existingConnection = await prisma.companyConnection.findUnique({
      where: {
        fromCompanyId_toCompanyId: {
          fromCompanyId,
          toCompanyId: data.toCompanyId,
        },
      },
    });

    if (existingConnection) {
      throw new Error(ERROR_MESSAGES.ALREADY_CONNECTED);
    }

    // Create connection request
    const connection = await prisma.companyConnection.create({
      data: {
        fromCompanyId,
        toCompanyId: data.toCompanyId,
        status: ConnectionStatus.PENDING,
        requestMessage: data.requestMessage,
      },
      include: {
        fromCompany: {
          select: { id: true, name: true, slug: true },
        },
        toCompany: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return this.mapConnectionResponse(connection);
  }

  /**
   * Get all connection requests sent by company
   */
  static async getOutgoingConnections(
    companyId: string,
    status?: typeof ConnectionStatus[keyof typeof ConnectionStatus]
  ): Promise<ConnectionResponse[]> {
    const connections = await prisma.companyConnection.findMany({
      where: {
        fromCompanyId: companyId,
        ...(status && { status }),
      },
      include: {
        fromCompany: {
          select: { id: true, name: true, slug: true },
        },
        toCompany: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map(this.mapConnectionResponse);
  }

  /**
   * Get all connection requests received by company
   */
  static async getIncomingConnections(
    companyId: string,
    status?: typeof ConnectionStatus[keyof typeof ConnectionStatus]
  ): Promise<ConnectionResponse[]> {
    const connections = await prisma.companyConnection.findMany({
      where: {
        toCompanyId: companyId,
        ...(status && { status }),
      },
      include: {
        fromCompany: {
          select: { id: true, name: true, slug: true },
        },
        toCompany: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map(this.mapConnectionResponse);
  }

  /**
   * Get all active (accepted) connections
   */
  static async getActiveConnections(companyId: string): Promise<ConnectionResponse[]> {
    const connections = await prisma.companyConnection.findMany({
      where: {
        OR: [
          { fromCompanyId: companyId, status: ConnectionStatus.ACCEPTED },
          { toCompanyId: companyId, status: ConnectionStatus.ACCEPTED },
        ],
      },
      include: {
        fromCompany: {
          select: { id: true, name: true, slug: true },
        },
        toCompany: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { connectedAt: 'desc' },
    });

    return connections.map(this.mapConnectionResponse);
  }

  /**
   * Get connection between two companies
   */
  static async getConnection(
    fromCompanyId: string,
    toCompanyId: string
  ): Promise<ConnectionResponse> {
    const connection = await prisma.companyConnection.findFirst({
      where: {
        OR: [
          { fromCompanyId, toCompanyId },
          { fromCompanyId: toCompanyId, toCompanyId: fromCompanyId },
        ],
      },
      include: {
        fromCompany: {
          select: { id: true, name: true, slug: true },
        },
        toCompany: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!connection) {
      throw new Error(ERROR_MESSAGES.CONNECTION_NOT_FOUND);
    }

    return this.mapConnectionResponse(connection);
  }

  /**
   * Accept connection request
   */
  static async acceptConnection(
    connectionId: string,
    companyId: string
  ): Promise<ConnectionResponse> {
    const connection = await prisma.companyConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error(ERROR_MESSAGES.CONNECTION_NOT_FOUND);
    }

    // Only the receiving company can accept
    if (connection.toCompanyId !== companyId) {
      throw new Error('Only the receiving company can accept this request');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new Error(`Cannot accept connection with status: ${connection.status}`);
    }

    const updated = await prisma.companyConnection.update({
      where: { id: connectionId },
      data: {
        status: ConnectionStatus.ACCEPTED,
        connectedAt: new Date(),
      },
      include: {
        fromCompany: {
          select: { id: true, name: true, slug: true },
        },
        toCompany: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return this.mapConnectionResponse(updated);
  }

  /**
   * Reject connection request
   */
  static async rejectConnection(
    connectionId: string,
    companyId: string
  ): Promise<void> {
    const connection = await prisma.companyConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error(ERROR_MESSAGES.CONNECTION_NOT_FOUND);
    }

    // Only the receiving company can reject
    if (connection.toCompanyId !== companyId) {
      throw new Error('Only the receiving company can reject this request');
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new Error(`Cannot reject connection with status: ${connection.status}`);
    }

    await prisma.companyConnection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.REJECTED },
    });
  }

  /**
   * Block connection
   */
  static async blockConnection(
    connectionId: string,
    companyId: string
  ): Promise<void> {
    const connection = await prisma.companyConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error(ERROR_MESSAGES.CONNECTION_NOT_FOUND);
    }

    // Either company can block
    if (connection.fromCompanyId !== companyId && connection.toCompanyId !== companyId) {
      throw new Error('You are not part of this connection');
    }

    await prisma.companyConnection.update({
      where: { id: connectionId },
      data: { status: ConnectionStatus.BLOCKED },
    });
  }

  /**
   * Get pending connection count
   */
  static async getPendingConnectionCount(companyId: string): Promise<number> {
    return prisma.companyConnection.count({
      where: {
        toCompanyId: companyId,
        status: ConnectionStatus.PENDING,
      },
    });
  }

  /**
   * Map database connection to response format
   */
  private static mapConnectionResponse(connection: any): ConnectionResponse {
    return {
      id: connection.id,
      fromCompanyId: connection.fromCompanyId,
      fromCompany: connection.fromCompany,
      toCompanyId: connection.toCompanyId,
      toCompany: connection.toCompany,
      status: connection.status,
      connectionType: connection.connectionType, // NEW
      requestMessage: connection.requestMessage,
      connectedAt: connection.connectedAt,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }

  // ============================================
  // PHASE 2: PERMISSION MANAGEMENT (NEW METHODS)
  // ============================================

  /**
   * Grant permissions to a connected company
   */
  static async grantPermissions(
    connectionId: string,
    grantingCompanyId: string,
    permissions: PermissionSet
  ) {
    const connection = await prisma.companyConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error(ERROR_MESSAGES.CONNECTION_NOT_FOUND);
    }

    // Can only grant permissions if you're the receiving company
    if (connection.toCompanyId !== grantingCompanyId) {
      throw new Error('Only receiving company can grant permissions');
    }

    const otherCompanyId =
      connection.fromCompanyId === grantingCompanyId
        ? connection.toCompanyId
        : connection.fromCompanyId;

    // Build update object with only provided fields
    const updateData: any = {};
    if (permissions.canViewInventory !== undefined) updateData.canViewInventory = permissions.canViewInventory;
    if (permissions.canCreateOrders !== undefined) updateData.canCreateOrders = permissions.canCreateOrders;
    if (permissions.canViewOrders !== undefined) updateData.canViewOrders = permissions.canViewOrders;
    if (permissions.canCreateInvoices !== undefined) updateData.canCreateInvoices = permissions.canCreateInvoices;
    if (permissions.canViewInvoices !== undefined) updateData.canViewInvoices = permissions.canViewInvoices;
    if (permissions.canAccessPricing !== undefined) updateData.canAccessPricing = permissions.canAccessPricing;
    if (permissions.canReceiveMessages !== undefined) updateData.canReceiveMessages = permissions.canReceiveMessages;
    if (permissions.customPermissions) updateData.customPermissions = JSON.stringify(permissions.customPermissions);

    return prisma.connectionPermission.upsert({
      where: {
        companyId_connectionId: {
          companyId: otherCompanyId,
          connectionId,
        },
      },
      create: {
        companyId: otherCompanyId,
        connectionId,
        canViewInventory: permissions.canViewInventory || false,
        canCreateOrders: permissions.canCreateOrders || false,
        canViewOrders: permissions.canViewOrders || false,
        canCreateInvoices: permissions.canCreateInvoices || false,
        canViewInvoices: permissions.canViewInvoices || false,
        canAccessPricing: permissions.canAccessPricing || false,
        canReceiveMessages: permissions.canReceiveMessages !== false,
        customPermissions: JSON.stringify(permissions.customPermissions || {}),
      },
      update: updateData,
    });
  }

  /**
   * Get permissions for a connection
   */
  static async getPermissions(connectionId: string, companyId: string) {
    const connection = await prisma.companyConnection.findUnique({
      where: { id: connectionId },
      include: {
        permissions: {
          where: { companyId },
        },
      },
    });

    if (!connection) {
      throw new Error(ERROR_MESSAGES.CONNECTION_NOT_FOUND);
    }

    return connection.permissions[0] || null;
  }

  /**
   * Check if connection has specific permission
   */
  static async hasPermission(
    fromCompanyId: string,
    toCompanyId: string,
    permissionKey: keyof PermissionSet
  ): Promise<boolean> {
    const connection = await prisma.companyConnection.findUnique({
      where: {
        fromCompanyId_toCompanyId: {
          fromCompanyId,
          toCompanyId,
        },
      },
      include: {
        permissions: {
          where: { companyId: toCompanyId },
        },
      },
    });

    if (!connection || connection.status !== ConnectionStatus.ACCEPTED) {
      return false;
    }

    const perms = connection.permissions[0];
    if (!perms) return false;

    // Dynamically check permission
    return (perms as any)[permissionKey] === true;
  }
}
