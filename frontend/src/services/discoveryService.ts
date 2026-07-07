import { UserProfile, FirmProfile, DiscoveryFilters } from '@/types/discovery';
import { networkService } from './networkService';
import { firmService } from './firmService';
import { apiClient } from './api';

class DiscoveryService {
  private generateMockFirms(): FirmProfile[] {
    return [
      {
        id: 'service-firm',
        name: 'Service Firm',
        description: 'Premium business consulting and digital transformation services',
        industry: 'Professional Services',
        location: 'Global',
        connectionCount: 12500,
        isConnected: false,
      },
      {
        id: 'expert-portfolio',
        name: 'Expert Portfolio',
        description: 'Specializing in large-scale infrastructure and digital transformation projects',
        industry: 'Infrastructure & IT',
        location: 'London, UK',
        connectionCount: 8400,
        isConnected: false,
      },
      {
        id: 'resource-hub',
        name: 'Knowledge Hub',
        description: 'The leading authority in industry research and B2B educational resources',
        industry: 'Research & Education',
        location: 'Amsterdam, Netherlands',
        connectionCount: 15600,
        isConnected: false,
      },
      {
        id: 'subscription-pro',
        name: 'Subscription model',
        description: 'Reliable ongoing support and maintenance through our industry-leading SLA packages',
        industry: 'Maintenance & Support',
        location: 'Singapore',
        connectionCount: 4200,
        isConnected: false,
      },
      {
        id: 'abibas',
        name: 'Abibas',
        description: 'Leading sports brand specializing in high-performance footwear and apparel',
        industry: 'Sporting Goods',
        location: 'Herzogenaurach, Germany',
        connectionCount: 1500000,
        isConnected: false,
      },
      {
        id: 'global-logistics-corp',
        name: 'Global Logistics Corp',
        description: 'Leading international logistics and supply chain solutions',
        industry: 'Logistics',
        location: 'Singapore',
        connectionCount: 1250,
        isConnected: false,
      },
    ];
  }

  async discoverUsers(filters?: DiscoveryFilters): Promise<UserProfile[]> {
    const response = await apiClient.discoverUsers(20);
    let users: UserProfile[] = (response?.data || []).map((u: any) => ({
      ...u,
      isConnected: false,
    }));

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
    await new Promise(resolve => setTimeout(resolve, 400));
    const mockFirms = this.generateMockFirms();
    
    // Fetch user-created firms
    const registeredFirms = await firmService.getRegisteredFirms();
    
    // Use a Map to merge mocks and registered firms, prioritizing registered ones
    const firmsMap = new Map<string, any>();
    
    mockFirms.forEach(f => firmsMap.set(f.id, { ...f, isConnected: false }));
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
    
    // Check both mock and registered firms
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
