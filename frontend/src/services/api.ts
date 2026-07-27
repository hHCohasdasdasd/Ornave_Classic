/// <reference types="vite/client" />
import axios, { AxiosInstance, AxiosError } from 'axios';
import { TokenStorage } from '@/utils/storage';
import { ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_BYPASS_ENABLED = true;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add token to headers
    this.client.interceptors.request.use(
      (config) => {
        const token = TokenStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          if (!AUTH_BYPASS_ENABLED) {
            // Token expired - clear storage and redirect to login
            TokenStorage.clear();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: any): never {
    if (error.response) {
      throw new Error(error.response.data?.message || 'An error occurred');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw error;
    }
  }

  async get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  async patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }

  // AUTH ENDPOINTS
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    companyName?: string,
    userType: 'USER' | 'COMPANY_USER' = 'COMPANY_USER'
  ) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        companyName,
        userType,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getProfile() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/auth/profile');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    bio?: string;
  }) {
    try {
      const response = await this.client.put<ApiResponse<any>>('/auth/profile', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async changePassword(oldPassword: string, newPassword: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // COMPANY ENDPOINTS
  async createCompany(name: string, slug: string, description: string, website: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/companies', {
        name,
        slug,
        description,
        website,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCompany(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/companies/${companyId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateCompanySettings(companyId: string, settings: any) {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/companies/${companyId}/settings`,
        settings
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // MODULES ENDPOINTS
  async getCompanyModules(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/companies/${companyId}/modules`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createModule(companyId: string, name: string, description: string, icon: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/companies/${companyId}/modules`,
        { name, description, icon, visible: true }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateModule(companyId: string, moduleId: string, data: any) {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/companies/${companyId}/modules/${moduleId}`,
        data
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteModule(companyId: string, moduleId: string) {
    try {
      const response = await this.client.delete<ApiResponse<any>>(
        `/companies/${companyId}/modules/${moduleId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // PAGES ENDPOINTS
  async getCompanyPages(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/companies/${companyId}/pages`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createPage(companyId: string, name: string, slug: string, description: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/companies/${companyId}/pages`,
        { name, slug, description, layout: { components: [] } }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updatePage(companyId: string, pageId: string, data: any) {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/companies/${companyId}/pages/${pageId}`,
        data
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updatePageLayout(companyId: string, pageId: string, layout: any) {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/companies/${companyId}/pages/${pageId}/layout`,
        { layout }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deletePage(companyId: string, pageId: string) {
    try {
      const response = await this.client.delete<ApiResponse<any>>(
        `/companies/${companyId}/pages/${pageId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // CONNECTIONS ENDPOINTS
  async sendConnectionRequest(companyId: string, toCompanyId: string, message?: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/companies/${companyId}/connections`,
        { toCompanyId, requestMessage: message }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getIncomingConnections(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/companies/${companyId}/connections/incoming`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getActiveConnections(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/companies/${companyId}/connections/active`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async acceptConnection(companyId: string, connectionId: string) {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/companies/${companyId}/connections/${connectionId}/accept`,
        {}
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // TRANSACTIONS ENDPOINTS
  async createTransaction(
    companyId: string,
    toCompanyId: string,
    type: string,
    reference: string,
    data: any
  ) {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/companies/${companyId}/transactions`,
        { toCompanyId, type, reference, data }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getReceivedTransactions(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/companies/${companyId}/transactions/received`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateTransactionStatus(companyId: string, transactionId: string, status: string) {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/companies/${companyId}/transactions/${transactionId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // MESSAGES ENDPOINTS
  async sendMessage(companyId: string, toCompanyId: string, content: string, subject?: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/companies/${companyId}/messages`,
        { toCompanyId, content, subject }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getReceivedMessages(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/companies/${companyId}/messages/received`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUnreadCount(companyId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/companies/${companyId}/messages/unread/count`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async markMessageAsRead(companyId: string, messageId: string) {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/companies/${companyId}/messages/${messageId}/read`,
        {}
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ORNAVE GLOBAL ENDPOINTS
  async getGlobalDashboard() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/global/dashboard');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getGlobalConnections() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/global/connections');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async requestGlobalConnection(companyId: string, relationshipType?: string, permissions?: any) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/global/connections', {
        companyId,
        relationshipType,
        permissions,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getGlobalRequests() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/global/requests');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createGlobalRequest(payload: any) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/global/requests', payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getGlobalDocuments() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/global/documents');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async uploadGlobalDocument(payload: any) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/global/documents', payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getGlobalPayments() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/global/payments');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createGlobalPayment(payload: any) {
    try {
      const response = await this.client.post<ApiResponse<any>>('/global/payments', payload);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getGlobalActivity() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/global/activity');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // USER CONNECTIONS ENDPOINTS (individual user social graph)
  async discoverUsers(limit = 10) {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/discover', { params: { limit } });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserBySlug(slug: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/users/by-slug/${slug}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMyConnections() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/connections');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getConnectionsOfUser(userId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/users/connections/of/${userId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getConnectionStats() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/connections/stats');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getIncomingConnectionRequests() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/connections/requests');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOutgoingConnectionRequests() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/connections/sent');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserConnectionStatus(userId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/users/connections/status/${userId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async sendUserConnectionRequest(userId: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(`/users/connections/${userId}/request`, {});
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async acceptUserConnectionRequest(connectionId: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(`/users/connections/${connectionId}/accept`, {});
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async rejectUserConnectionRequest(connectionId: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(`/users/connections/${connectionId}/reject`, {});
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeUserConnection(userId: string) {
    try {
      const response = await this.client.delete<ApiResponse<any>>(`/users/connections/by-user/${userId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ── Partnered (deeper tier on top of an accepted connection) ──

  async getMyPartners() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/partners');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getIncomingPartnerRequests() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/partners/requests');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOutgoingPartnerRequests() {
    try {
      const response = await this.client.get<ApiResponse<any>>('/users/partners/sent');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserPartnerStatus(userId: string) {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/users/partners/status/${userId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async sendUserPartnerRequest(userId: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(`/users/partners/${userId}/request`, {});
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async acceptUserPartnerRequest(connectionId: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(`/users/partners/${connectionId}/accept`, {});
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async rejectUserPartnerRequest(connectionId: string) {
    try {
      const response = await this.client.post<ApiResponse<any>>(`/users/partners/${connectionId}/reject`, {});
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeUserPartner(userId: string) {
    try {
      const response = await this.client.delete<ApiResponse<any>>(`/users/partners/by-user/${userId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const apiClient = new ApiClient();
