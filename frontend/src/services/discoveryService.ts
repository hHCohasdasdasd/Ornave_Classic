import { UserProfile, FirmProfile, DiscoveryFilters } from '@/types/discovery';
import { networkService } from './networkService';
import { firmService } from './firmService';
import { apiClient } from './api';

class DiscoveryService {
  async discoverUsers(filters?: DiscoveryFilters): Promise<UserProfile[]> {
    let users: UserProfile[] = [];
    try {
      const response = await apiClient.discoverUsers(20);
      users = (response?.data || []).map((u: any) => ({
        ...u,
        isConnected: false,
      }));
    } catch {
      // Not logged in / suggestions unavailable — firms should still show.
      return [];
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      users = users.filter(u =>
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search) ||
        u.headline?.toLowerCase().includes(search)
      );
    }

    return users;
  }

  async discoverFirms(filters?: DiscoveryFilters): Promise<FirmProfile[]> {
    // Fetch user-created firms
    const registeredFirms = await firmService.getRegisteredFirms();

    // Use a Map to merge sources, prioritizing registered ones. Placeholder
    // filler firms (e.g. "Service Firm", "Subscription model") were dropped
    // from this pool — they had almost no real data and diluted the
    // fully fleshed-out companies below.
    const firmsMap = new Map<string, any>();

    // Real companies published to the global directory (see
    // /network/directory/search — the actual seeded companies live here).
    try {
      const response = await apiClient.get('/network/directory/search', {});
      const directoryResults = response?.data?.data || response?.data || [];
      directoryResults.forEach((profile: any) => {
        const slugOrId = profile.company?.slug || profile.companyId;
        firmsMap.set(slugOrId, {
          id: slugOrId,
          name: profile.company?.name,
          description: profile.company?.description || profile.about,
          logo: profile.company?.logo,
          industry: profile.industry,
          location: profile.country || 'Global',
          isConnected: false,
        });
      });
    } catch {
      // Directory search unavailable — registered firms still show.
    }

    registeredFirms.forEach(reg => {
      firmsMap.set(reg.id || reg.slug, {
        ...reg,
        id: reg.id || reg.slug,
        isConnected: false
      });
    });

    let firms = Array.from(firmsMap.values());
    
    // Check real follow status from the single source of truth
    const followed = await firmService.getFollowedFirms();
    firms = firms.map(f => ({
      ...f,
      isConnected: followed.some(followedFirm => followedFirm.id === f.id)
    }));

    // Apply filters with high-tolerance broad matching and multi-word support
    if (filters?.search) {
      const searchTerms = filters.search.toLowerCase().trim().split(/\s+/);
      firms = firms.filter(f => {
        const firmName = (f.name || '').toLowerCase();
        const firmDesc = (f.description || '').toLowerCase();
        const firmInd = (f.industry || '').toLowerCase();
        const firmId = (f.id || '').toLowerCase();
        
        // Ensure ALL search terms are found in at least one of the fields
        return searchTerms.every(term => 
          firmName.includes(term) || 
          firmDesc.includes(term) || 
          firmInd.includes(term) || 
          firmId.includes(term)
        );
      });
    }
    
    if (filters?.industry) {
      firms = firms.filter(f => f.industry === filters.industry);
    }
    
    return firms;
  }

  async sendConnectionRequest(userId: string): Promise<void> {
    await networkService.addConnection({ id: userId });
  }

  async connectWithFirm(firmId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check registered/discovered firms
    const firms = await this.discoverFirms();
    const firm = firms.find(f => f.id === firmId);
    
    if (firm) {
      await firmService.followFirm({
        id: firm.id,
        name: firm.name,
        headline: firm.industry || firm.headline,
        location: firm.location
      });
    }
  }
}

export const discoveryService = new DiscoveryService();
