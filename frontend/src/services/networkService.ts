import { ConnectionRequest, UserProfile } from '@/types/discovery';
import { apiClient } from './api';
import { firmService } from './firmService';

class NetworkService {
  async searchDirectory(filters: any): Promise<any[]> {
    const results: any[] = [];

    // Real companies published to the global directory (see
    // /network/directory/search — only returns isPublicProfile firms).
    try {
      const response = await apiClient.get('/network/directory/search', {
        params: {
          industry: filters.industry,
          country: filters.country,
          capability: filters.capability,
          name: filters.name,
        },
      });
      const directoryResults = response?.data?.data || response?.data || [];
      directoryResults.forEach((profile: any) => results.push({ ...profile, type: 'firm' }));
    } catch {
      // Directory search unavailable — fall back to locally-registered firms only.
    }

    // Firms a user registered from this browser but hasn't been published yet.
    const registeredFirms = await firmService.getRegisteredFirms();
    registeredFirms.forEach(firm => {
      if (results.some(r => r.companyId === firm.id)) return;
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

  /** Resolve a "firstname-lastname" profile slug to a real registered user, if one exists. */
  async resolveUserBySlug(slug: string): Promise<UserProfile | null> {
    try {
      const response = await apiClient.getUserBySlug(slug);
      return response?.data || null;
    } catch {
      return null;
    }
  }

  async getRecentConnections(): Promise<UserProfile[]> {
    const response = await apiClient.getMyConnections();
    return (response?.data || []).map((u: any) => ({ ...u, isConnected: true }));
  }

  /** Real "people you may know" suggestions — other registered users not already connected/pending. */
  async getSuggestedUsers(limit = 10): Promise<UserProfile[]> {
    try {
      const response = await apiClient.discoverUsers(limit);
      return response?.data || [];
    } catch {
      return [];
    }
  }

  /** Another member's accepted connections — used when viewing their profile, not our own. */
  async getConnectionsOf(userId: string): Promise<UserProfile[]> {
    try {
      const response = await apiClient.getConnectionsOfUser(userId);
      return response?.data || [];
    } catch {
      return [];
    }
  }

  /** Real users you and `otherUserId` are both connected to. */
  async getMutualConnections(otherUserId: string): Promise<UserProfile[]> {
    try {
      const [mine, theirs] = await Promise.all([
        this.getRecentConnections(),
        this.getConnectionsOf(otherUserId),
      ]);
      const theirIds = new Set(theirs.map((u: any) => u.id));
      return mine.filter((u: any) => theirIds.has(u.id));
    } catch {
      return [];
    }
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

  // ── Partnered: a deeper tier on top of an existing accepted connection ──

  async getPartners(): Promise<UserProfile[]> {
    const response = await apiClient.getMyPartners();
    return (response?.data || []).map((u: any) => ({ ...u, isPartnered: true }));
  }

  /** Propose deepening an existing connection to Partnered. Requires an accepted connection first. */
  async requestPartnership(profileId: string): Promise<void> {
    await apiClient.sendUserPartnerRequest(profileId);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'partner_request', id: profileId } }));
  }

  async acceptPartnership(connectionId: string): Promise<void> {
    await apiClient.acceptUserPartnerRequest(connectionId);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'partner_accept', id: connectionId } }));
  }

  async rejectPartnership(connectionId: string): Promise<void> {
    await apiClient.rejectUserPartnerRequest(connectionId);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'partner_reject', id: connectionId } }));
  }

  async removePartnership(profileId: string): Promise<void> {
    await apiClient.removeUserPartner(profileId);
    window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'partner_remove', id: profileId } }));
  }

  /** 'NOT_CONNECTED' | 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'PARTNERED' | 'SELF' */
  async getPartnerStatus(profileId: string): Promise<string> {
    try {
      const response = await apiClient.getUserPartnerStatus(profileId);
      return response?.data?.status || 'NOT_CONNECTED';
    } catch {
      return 'NOT_CONNECTED';
    }
  }

  async getPartnerRequests(): Promise<ConnectionRequest[]> {
    const response = await apiClient.getIncomingPartnerRequests();
    return response?.data || [];
  }

  async getSentPartnerRequests(): Promise<ConnectionRequest[]> {
    const response = await apiClient.getOutgoingPartnerRequests();
    return response?.data || [];
  }
}

export const networkService = new NetworkService();
