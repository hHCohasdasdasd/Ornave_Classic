import { apiClient } from './api';
import { FeedItem, Mention } from '@/types/feed';
import { Publication } from './publicationService';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tag: string;
  coverImage?: string;
  createdById: string;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
}

export interface GroupMemberEntry {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    headline?: string;
    profilePicture?: string;
    companyName?: string;
  };
}

const mapPost = (post: any): FeedItem => ({
  id: post.id,
  type: post.type || 'post',
  author: {
    id: post.author?.id || post.authorId,
    firstName: post.author?.firstName || 'Unknown',
    lastName: post.author?.lastName || '',
    headline: post.author?.headline,
    profilePicture: post.author?.profilePicture,
  },
  content: post.content,
  title: post.title,
  mediaUrl: post.mediaUrl,
  timestamp: post.timestamp || new Date().toISOString(),
  reactions: post.reactions || { likes: 0, comments: 0 },
  linkedPublication: post.linkedPublication || null,
  mentions: post.mentions || [],
});

class GroupService {
  async listGroups(search?: string): Promise<Group[]> {
    try {
      const response = await apiClient.get('/groups', { params: { search } });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return [];
    }
  }

  async getGroup(slug: string): Promise<Group | null> {
    try {
      const response = await apiClient.get(`/groups/${slug}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch group:', error);
      return null;
    }
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    const response = await apiClient.post('/groups', { name, description });
    return response.data.data || response.data;
  }

  async joinGroup(slug: string): Promise<void> {
    await apiClient.post(`/groups/${slug}/join`, {});
  }

  async leaveGroup(slug: string): Promise<void> {
    await apiClient.post(`/groups/${slug}/leave`, {});
  }

  async getMembers(slug: string): Promise<GroupMemberEntry[]> {
    try {
      const response = await apiClient.get(`/groups/${slug}/members`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      return [];
    }
  }

  async getDiscussions(slug: string): Promise<FeedItem[]> {
    try {
      const response = await apiClient.get(`/groups/${slug}/discussions`);
      const data = response.data.data || response.data;
      return (data.items || []).map(mapPost);
    } catch (error) {
      console.error('Failed to fetch group discussions:', error);
      return [];
    }
  }

  async postDiscussion(slug: string, content: string, title?: string, mediaUrl?: string, linkedPublicationId?: string, mentions?: Mention[]): Promise<FeedItem> {
    const response = await apiClient.post(`/groups/${slug}/discussions`, { content, title, mediaUrl, linkedPublicationId, mentions });
    return mapPost(response.data.data || response.data);
  }

  async getGroupPublications(slug: string): Promise<Publication[]> {
    try {
      const response = await apiClient.get(`/groups/${slug}/publications`);
      const data = response.data.data || response.data;
      return data.items || [];
    } catch (error) {
      console.error('Failed to fetch group publications:', error);
      return [];
    }
  }
}

export const groupService = new GroupService();
