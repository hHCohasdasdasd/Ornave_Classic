import { apiClient } from './api';
import { FirmConnectionFile, Ticket, TicketStatus, TicketWithMessages } from '@/types/discovery';

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

  async updateBanner(companyId: string, bannerUrl: string | null): Promise<{ id: string; bannerUrl: string | null }> {
    const response = await apiClient.put(`/companies/${companyId}/banner`, { bannerUrl });
    return response.data.data;
  }

  async getTickets(connectionId: string): Promise<Ticket[]> {
    const response = await apiClient.get(`/company-clients/${connectionId}/tickets`);
    return response.data.data || [];
  }

  async getTicket(ticketId: string): Promise<TicketWithMessages> {
    const response = await apiClient.get(`/company-clients/tickets/${ticketId}`);
    return response.data.data;
  }

  async sendTicketMessage(ticketId: string, content: string) {
    const response = await apiClient.post(`/company-clients/tickets/${ticketId}/messages`, { content });
    return response.data.data;
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<Ticket> {
    const response = await apiClient.patch(`/company-clients/tickets/${ticketId}/status`, { status });
    return response.data.data;
  }

  async getFiles(connectionId: string): Promise<FirmConnectionFile[]> {
    const response = await apiClient.get(`/company-clients/${connectionId}/files`);
    return response.data.data || [];
  }

  async uploadFile(connectionId: string, file: File, onProgress?: (percent: number) => void): Promise<FirmConnectionFile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/company-clients/${connectionId}/files`, formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: onProgress
        ? (e: { loaded: number; total?: number }) => {
            if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          }
        : undefined,
    });
    return response.data.data;
  }

  async getFileDownloadUrl(connectionId: string, fileId: string): Promise<string> {
    const response = await apiClient.get(`/company-clients/${connectionId}/files/${fileId}/download`);
    return response.data.data.url;
  }

  async deleteFile(connectionId: string, fileId: string): Promise<void> {
    await apiClient.delete(`/company-clients/${connectionId}/files/${fileId}`);
  }
}

export const companyClientService = new CompanyClientService();
