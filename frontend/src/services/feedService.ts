import { FeedResponse, FeedItem, ServiceCard } from '@/types/feed';
import { apiClient } from './api';

class FeedService {
  async getFeed(_cursor?: string, theme?: string, tag?: string): Promise<FeedResponse> {
    try {
      const response = await apiClient.get('/posts', {
        params: {
          limit: 50,
          offset: 0,
          visibility: 'public',
          theme,
          tag,
        },
      });

      const data = response.data.data || response.data;

      // Convert API response to FeedItem format
      const items: FeedItem[] = (data.items || []).map((post: any) => ({
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
        tags: post.tags || [],
      }));

      return {
        items,
        hasMore: data.hasMore || false,
        cursor: undefined,
      };
    } catch (error) {
      console.error('Failed to fetch feed:', error);
      // Return empty feed on error
      return {
        items: [],
        hasMore: false,
        cursor: undefined,
      };
    }
  }

  async getPost(postId: string): Promise<FeedItem | null> {
    try {
      const response = await apiClient.get(`/posts/${postId}`);
      const post = response.data.data || response.data;

      return {
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
        timestamp: post.timestamp || post.createdAt || new Date().toISOString(),
        reactions: post.reactions || { likes: 0, comments: 0 },
        tags: post.tags || [],
      };
    } catch (error) {
      console.error('Failed to fetch post:', error);
      return null;
    }
  }

  async createPost(content: string, mediaUrl?: string, title?: string, serviceCard?: ServiceCard, tags?: string[]): Promise<FeedItem> {
    try {
      const response = await apiClient.post('/posts', {
        title,
        content,
        mediaUrl,
        type: 'post',
        visibility: 'public',
        tags,
      });

      const post = response.data.data || response.data;

      return {
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
        metadata: serviceCard ? { serviceCard } : undefined,
        tags: post.tags || [],
      };
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  /** Delete a post. Backend enforces the caller is the post's own author. */
  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(`/posts/${postId}`);
  }

  async getUserPosts(userId: string): Promise<FeedResponse> {
    try {
      const response = await apiClient.get(`/posts/user/${userId}`);

      const data = response.data.data || response.data;

      // Convert API response to FeedItem format
      const items: FeedItem[] = (data.items || []).map((post: any) => ({
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
        tags: post.tags || [],
      }));

      return {
        items,
        hasMore: false,
        cursor: undefined,
      };
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      return {
        items: [],
        hasMore: false,
        cursor: undefined,
      };
    }
  }

  async getTrendingPosts(): Promise<FeedItem[]> {
    try {
      const response = await apiClient.get('/posts/trending', {
        params: {
          limit: 10,
          period: 'week', // Last 7 days
        },
      });

      const data = response.data.data || response.data;
      
      // Convert API response to FeedItem format
      const items: FeedItem[] = (Array.isArray(data) ? data : data.items || []).map((post: any) => ({
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
        timestamp: post.timestamp || post.createdAt || new Date().toISOString(),
        reactions: post.reactions || { likes: 0, comments: 0 },
        tags: post.tags || [],
      }));

      return items;
    } catch (error) {
      console.error('Failed to fetch trending posts:', error);
      return [];
    }
  }

  async getTopThemes(): Promise<string[]> {
    try {
      const response = await apiClient.get('/posts/themes', {
        params: {
          limit: 8,
          period: 'week',
        },
      });

      const data = response.data.data || response.data;
      return Array.isArray(data) ? data : data.themes || [];
    } catch (error) {
      console.error('Failed to fetch top themes:', error);
      return [];
    }
  }

  async getComments(postId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/posts/${postId}/comments`);
      return response.data.data || response.data || [];
    } catch {
      return [];
    }
  }

  async addComment(postId: string, content: string): Promise<any> {
    const response = await apiClient.post(`/posts/${postId}/comments`, { content });
    return response.data.data || response.data;
  }

}

export const feedService = new FeedService();

