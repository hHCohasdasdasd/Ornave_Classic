import { apiClient } from './api';
import { Mention } from '@/types/feed';

export interface Publication {
  id: string;
  authorId: string;
  companyId?: string | null;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    headline?: string;
    profilePicture?: string;
    companyName?: string;
  };
  title: string;
  content: string;
  coverImage?: string;
  tags: string[];
  mentions: Mention[];
  reactions: { likes: number; comments: number };
  visibility: string;
  timestamp: string;
  isDeleted: boolean;
}

class PublicationService {
  async createPublication(params: {
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    postAsCompany?: boolean;
    mentions?: Mention[];
  }): Promise<Publication> {
    const response = await apiClient.post('/publications', params);
    return response.data.data || response.data;
  }

  async listPublications(options: { tag?: string; authorId?: string } = {}): Promise<Publication[]> {
    try {
      const response = await apiClient.get('/publications', { params: options });
      const data = response.data.data || response.data;
      return data.items || [];
    } catch (error) {
      console.error('Failed to fetch publications:', error);
      return [];
    }
  }

  async getTrendingTags(limit = 8): Promise<string[]> {
    try {
      const response = await apiClient.get('/publications/tags/trending', { params: { limit } });
      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch trending publication tags:', error);
      return [];
    }
  }

  async getPublication(id: string): Promise<Publication | null> {
    try {
      const response = await apiClient.get(`/publications/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch publication:', error);
      return null;
    }
  }

  async deletePublication(id: string): Promise<void> {
    await apiClient.delete(`/publications/${id}`);
  }

  async updateReactions(id: string, reactions: { likes: number; comments: number }): Promise<void> {
    await apiClient.patch(`/publications/${id}/reactions`, { reactions });
  }

  async getComments(id: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/publications/${id}/comments`);
      return response.data.data || response.data || [];
    } catch {
      return [];
    }
  }

  async addComment(id: string, content: string): Promise<any> {
    const response = await apiClient.post(`/publications/${id}/comments`, { content });
    return response.data.data || response.data;
  }
}

export const publicationService = new PublicationService();
