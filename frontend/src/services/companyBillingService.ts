import { apiClient } from './api';

export interface CompanyInvoice {
  id: string;
  companyId: string;
  description: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  invoiceDate: string;
  createdAt: string;
  updatedAt: string;
}

class CompanyBillingService {
  async listInvoices(companyId: string): Promise<CompanyInvoice[]> {
    const response = await apiClient.get(`/companies/${companyId}/invoices`);
    return response.data.data || [];
  }

  async createInvoice(
    companyId: string,
    data: Partial<Pick<CompanyInvoice, 'description' | 'amount' | 'status' | 'invoiceDate'>>
  ): Promise<CompanyInvoice> {
    const response = await apiClient.post(`/companies/${companyId}/invoices`, data);
    return response.data.data;
  }
}

export const companyBillingService = new CompanyBillingService();
