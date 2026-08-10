import { apiClient } from './api';

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  title?: string;
  leadCompany?: string;
  location?: string;
  industry?: string;
  connections: number;
  mutualConnections?: number;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
}

class LeadsService {
  async listLeads(companyId: string): Promise<Lead[]> {
    const response = await apiClient.get(`/companies/${companyId}/leads`);
    return response.data.data || [];
  }

  async createLead(
    companyId: string,
    data: Partial<Pick<Lead, 'name' | 'title' | 'leadCompany' | 'location' | 'industry' | 'connections' | 'mutualConnections' | 'saved'>>
  ): Promise<Lead> {
    const response = await apiClient.post(`/companies/${companyId}/leads`, data);
    return response.data.data;
  }

  async updateLead(
    companyId: string,
    leadId: string,
    data: Partial<Pick<Lead, 'name' | 'title' | 'leadCompany' | 'location' | 'industry' | 'connections' | 'mutualConnections' | 'saved'>>
  ): Promise<Lead> {
    const response = await apiClient.put(`/companies/${companyId}/leads/${leadId}`, data);
    return response.data.data;
  }

  async deleteLead(companyId: string, leadId: string): Promise<void> {
    await apiClient.delete(`/companies/${companyId}/leads/${leadId}`);
  }
}

export const leadsService = new LeadsService();
