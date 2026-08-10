import { apiClient } from './api';

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  type: 'Sponsored Content' | 'Text Ad' | 'Message Ad' | 'Dynamic Ad';
  status: 'Active' | 'Paused' | 'Draft' | 'Completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

class MarketingService {
  async listCampaigns(companyId: string): Promise<Campaign[]> {
    const response = await apiClient.get(`/companies/${companyId}/campaigns`);
    return response.data.data || [];
  }

  async createCampaign(
    companyId: string,
    data: Partial<Pick<Campaign, 'name' | 'type' | 'status' | 'budget' | 'spent' | 'impressions' | 'clicks' | 'conversions'>>
  ): Promise<Campaign> {
    const response = await apiClient.post(`/companies/${companyId}/campaigns`, data);
    return response.data.data;
  }

  async updateCampaign(
    companyId: string,
    campaignId: string,
    data: Partial<Pick<Campaign, 'name' | 'type' | 'status' | 'budget' | 'spent' | 'impressions' | 'clicks' | 'conversions'>>
  ): Promise<Campaign> {
    const response = await apiClient.put(`/companies/${companyId}/campaigns/${campaignId}`, data);
    return response.data.data;
  }

  async deleteCampaign(companyId: string, campaignId: string): Promise<void> {
    await apiClient.delete(`/companies/${companyId}/campaigns/${campaignId}`);
  }
}

export const marketingService = new MarketingService();
