import { apiClient } from './api';
import { DirectConversation, DirectMessage, DirectMessageUser } from '@/types/discovery';

class DirectMessageService {
  async getConversations(): Promise<DirectConversation[]> {
    const response = await apiClient.get('/messages/conversations');
    return response.data.data || [];
  }

  async getUser(userId: string): Promise<DirectMessageUser | null> {
    try {
      const response = await apiClient.get(`/messages/users/${userId}`);
      return response.data.data;
    } catch {
      return null;
    }
  }

  async getThread(userId: string): Promise<DirectMessage[]> {
    const response = await apiClient.get(`/messages/conversations/${userId}`);
    return response.data.data || [];
  }

  async sendMessage(userId: string, content: string): Promise<DirectMessage> {
    const response = await apiClient.post(`/messages/conversations/${userId}`, { content });
    return response.data.data;
  }
}

export const directMessageService = new DirectMessageService();
