import { apiClient } from './api';

export interface EventAuthor {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  profilePicture?: string;
  companyName?: string;
}

export interface EventMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface TicketProductSummary {
  id: string;
  companyId: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  stock: number;
}

export interface OrnaveEvent {
  id: string;
  authorId: string;
  author: EventAuthor;
  title: string;
  description: string | null;
  detailedDescription: string | null;
  coverImage: string | null;
  media?: string;
  category: string | null;
  startAt: string;
  endAt: string | null;
  isVirtual: boolean;
  location: string | null;
  mapUrl?: string | null;
  externalLink?: string | null;
  price: number;
  currency: string;
  capacity: number | null;
  ticketProduct: TicketProductSummary | null;
  isPromoted: boolean;
  attendeeCount: number;
  interestedCount: number;
  myRsvp: 'GOING' | 'INTERESTED' | null;
  isSaved: boolean;
  isActive: boolean;
  createdAt: string;
}

export function getEventMedia(event: OrnaveEvent): EventMediaItem[] {
  if (event.media) {
    try {
      const parsed = JSON.parse(event.media);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return event.coverImage ? [{ type: 'image', url: event.coverImage }] : [];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  detailedDescription?: string;
  coverImage?: string;
  media?: EventMediaItem[];
  category?: string;
  startAt: string;
  endAt?: string;
  isVirtual?: boolean;
  location?: string;
  mapUrl?: string;
  externalLink?: string;
  price?: number;
  currency?: string;
  capacity?: number;
  ticketProductId?: string;
  isPromoted?: boolean;
}

class EventService {
  async listEvents(options: { category?: string; when?: 'upcoming' | 'past' } = {}): Promise<{ items: OrnaveEvent[]; total: number; hasMore: boolean }> {
    try {
      const response = await apiClient.get('/events', {
        params: { limit: 50, offset: 0, category: options.category, when: options.when },
      });
      const data = response.data.data || response.data;
      return { items: data.items || [], total: data.total || 0, hasMore: data.hasMore || false };
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return { items: [], total: 0, hasMore: false };
    }
  }

  async getPromotedEvents(): Promise<OrnaveEvent[]> {
    try {
      const response = await apiClient.get('/events/promoted');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch promoted events:', error);
      return [];
    }
  }

  async getEvent(eventId: string): Promise<OrnaveEvent | null> {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch event:', error);
      return null;
    }
  }

  async createEvent(data: CreateEventInput): Promise<OrnaveEvent> {
    const response = await apiClient.post('/events', data);
    return response.data.data || response.data;
  }

  async rsvp(eventId: string, status: 'GOING' | 'INTERESTED'): Promise<OrnaveEvent> {
    const response = await apiClient.post(`/events/${eventId}/rsvp`, { status });
    return response.data.data || response.data;
  }

  async cancelRsvp(eventId: string): Promise<OrnaveEvent> {
    const response = await apiClient.delete(`/events/${eventId}/rsvp`);
    return response.data.data || response.data;
  }

  async getMyEvents(): Promise<OrnaveEvent[]> {
    try {
      const response = await apiClient.get('/events/mine');
      return response.data.data || response.data;
    } catch {
      return [];
    }
  }

  async getAttendingEvents(): Promise<OrnaveEvent[]> {
    try {
      const response = await apiClient.get('/events/attending');
      return response.data.data || response.data;
    } catch {
      return [];
    }
  }

  async getSavedEvents(): Promise<OrnaveEvent[]> {
    try {
      const response = await apiClient.get('/events/saved');
      return response.data.data || response.data;
    } catch {
      return [];
    }
  }

  async saveEvent(eventId: string): Promise<OrnaveEvent> {
    const response = await apiClient.post(`/events/${eventId}/save`);
    return response.data.data || response.data;
  }

  async unsaveEvent(eventId: string): Promise<OrnaveEvent> {
    const response = await apiClient.delete(`/events/${eventId}/save`);
    return response.data.data || response.data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}`);
  }
}

export const eventService = new EventService();
