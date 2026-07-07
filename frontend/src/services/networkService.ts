import { ConnectionRequest, UserProfile } from '@/types/discovery';
import { apiClient } from './api';
import { firmService } from './firmService';

class NetworkService {
  async searchDirectory(filters: any): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Company/firm directory search is not yet backed by a real endpoint.
    // In a real app, this would be an API call
    const registeredFirms = await firmService.getRegisteredFirms();

    const results: any[] = [];

    registeredFirms.forEach(firm => {
      results.push({
        companyId: firm.id,
        company: {
          id: firm.id,
          name: firm.name,
          description: firm.description || 'Professional Entity',
          logo: firm.logo
        },
        industry: firm.industry || 'Various',
        location: firm.location || 'Global',
        type: 'firm'
      });
    });

    if (filters.name) {
      const search = filters.name.toLowerCase();
      return results.filter(r =>
        (r.company?.name && r.company.name.toLowerCase().includes(search))
      );
    }

    return results;
  }

  async getRecentConnections(): Promise<UserProfile[]> {
    const response = await apiClient.getMyConnections();
    return (response?.data || []).map((u: any) => ({ ...u, isConnected: true }));
  }

  async addConnection(profile: any): Promise<void> {
    if (!profile?.id) return;
    await apiClient.sendUserConnectionRequest(profile.id);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'connection_add', id: profile.id } }));
  }

  async removeConnection(profileId: string): Promise<void> {
    await apiClient.removeUserConnection(profileId);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'connection_remove', id: profileId } }));
  }

  async isConnected(profileId: string): Promise<boolean> {
    const status = await this.getConnectionStatus(profileId);
    return status === 'CONNECTED';
  }

  /** Richer status than isConnected(): 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED' | 'SELF' */
  async getConnectionStatus(profileId: string): Promise<string> {
    try {
      const response = await apiClient.getUserConnectionStatus(profileId);
      return response?.data?.status || 'NONE';
    } catch {
      return 'NONE';
    }
  }

  async acceptConnection(requestId: string): Promise<void> {
    await apiClient.acceptUserConnectionRequest(requestId);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'connection_accept', id: requestId } }));
  }

  async rejectConnection(requestId: string): Promise<void> {
    await apiClient.rejectUserConnectionRequest(requestId);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'connection_reject', id: requestId } }));
  }

  async getConnectionRequests(): Promise<ConnectionRequest[]> {
    const response = await apiClient.getIncomingConnectionRequests();
    return response?.data || [];
  }

  async getSentConnectionRequests(): Promise<ConnectionRequest[]> {
    const response = await apiClient.getOutgoingConnectionRequests();
    return response?.data || [];
  }

  async getNetworkStats(): Promise<{
    connectionCount: number;
    unreadMessages: number;
    notifications: number;
  }> {
    try {
      const response = await apiClient.getConnectionStats();
      const stats = response?.data || { connectionCount: 0, pendingRequestCount: 0 };
      return {
        connectionCount: stats.connectionCount,
        // Direct messaging isn't wired to a real backend yet, so this stays 0
        // rather than a fabricated number.
        unreadMessages: 0,
        notifications: stats.pendingRequestCount,
      };
    } catch {
      return { connectionCount: 0, unreadMessages: 0, notifications: 0 };
    }
  }
}

export const networkService = new NetworkService();
