import { apiClient } from './api';
import { AppNotification } from '@/types/discovery';

class NotificationService {
  async list(): Promise<AppNotification[]> {
    const response = await apiClient.get('/notifications');
    return response.data.data || [];
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data.count;
  }

  async markRead(id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`, {});
  }

  async markAllRead(): Promise<void> {
    await apiClient.post('/notifications/read-all', {});
  }
}

export const notificationService = new NotificationService();
