import { apiClient } from './api';

export interface CompanyClientConnection {
  id: string;
  status: string;
  relationshipType: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface ConnectionMessage {
  id: string;
  senderIsCompany: boolean;
  content: string;
  createdAt: string;
}

class CompanyClientService {
  async getClients(): Promise<CompanyClientConnection[]> {
    const response = await apiClient.get('/company-clients');
    return response.data.data || [];
  }

  async getMessages(connectionId: string): Promise<ConnectionMessage[]> {
    const response = await apiClient.get(`/company-clients/${connectionId}/messages`);
    return response.data.data || [];
  }

  async sendMessage(connectionId: string, content: string): Promise<ConnectionMessage> {
    const response = await apiClient.post(`/company-clients/${connectionId}/messages`, { content });
    return response.data.data;
  }
}

export const companyClientService = new CompanyClientService();
