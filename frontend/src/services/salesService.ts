import { apiClient } from './api';

export interface Deal {
  id: string;
  companyId: string;
  name: string;
  clientCompany?: string;
  value: number;
  stage: 'Prospect' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  owner?: string;
  closeDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

class SalesService {
  async listDeals(companyId: string): Promise<Deal[]> {
    const response = await apiClient.get(`/companies/${companyId}/deals`);
    return response.data.data || [];
  }

  async createDeal(
    companyId: string,
    data: Partial<Pick<Deal, 'name' | 'clientCompany' | 'value' | 'stage' | 'owner' | 'closeDate'>>
  ): Promise<Deal> {
    const response = await apiClient.post(`/companies/${companyId}/deals`, data);
    return response.data.data;
  }

  async updateDeal(
    companyId: string,
    dealId: string,
    data: Partial<Pick<Deal, 'name' | 'clientCompany' | 'value' | 'stage' | 'owner' | 'closeDate'>>
  ): Promise<Deal> {
    const response = await apiClient.put(`/companies/${companyId}/deals/${dealId}`, data);
    return response.data.data;
  }

  async deleteDeal(companyId: string, dealId: string): Promise<void> {
    await apiClient.delete(`/companies/${companyId}/deals/${dealId}`);
  }
}

export const salesService = new SalesService();
