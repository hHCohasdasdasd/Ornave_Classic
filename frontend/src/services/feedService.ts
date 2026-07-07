import { FeedResponse, FeedItem, ServiceCard } from '@/types/feed';
import { apiClient } from './api';

class FeedService {
  async getFeed(_cursor?: string, theme?: string): Promise<FeedResponse> {
    try {
      const response = await apiClient.get('/posts', {
        params: {
          limit: 50,
          offset: 0,
          visibility: 'public',
          theme,
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
      };
    } catch (error) {
      console.error('Failed to fetch post:', error);
      return null;
    }
  }

  async createPost(content: string, mediaUrl?: string, title?: string, serviceCard?: ServiceCard): Promise<FeedItem> {
    try {
      const response = await apiClient.post('/posts', {
        title,
        content,
        mediaUrl,
        type: 'post',
        visibility: 'public',
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
      };
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
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
      }));

      return items;
    } catch (error) {
      console.error('Failed to fetch trending posts:', error);
      // Return mock trending posts if API fails
      return this.getMockTrendingPosts();
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
      // Return mock themes if API fails
      return this.getMockTopThemes();
    }
  }

  private getMockTrendingPosts(): FeedItem[] {
    return [
      {
        id: 'trending-1',
        type: 'post',
        author: {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Anderson',
          headline: 'Supply Chain Manager',
          profilePicture: '',
        },
        content: 'Excited to announce our new partnership with Global Logistics! 🚀 This collaboration will expand our reach to 50+ new markets.',
        mediaUrl: '',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: { likes: 342, comments: 45 },
      },
      {
        id: 'trending-2',
        type: 'post',
        author: {
          id: '2',
          firstName: 'Michael',
          lastName: 'Chen',
          headline: 'Operations Director',
          profilePicture: '',
        },
        content: 'Just completed a successful pilot program with our clients. 20% efficiency improvement across all processes. #operationsExcellence',
        mediaUrl: '',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: { likes: 289, comments: 38 },
      },
      {
        id: 'trending-3',
        type: 'post',
        author: {
          id: '3',
          firstName: 'Emma',
          lastName: 'Williams',
          headline: 'Business Development Lead',
          profilePicture: '',
        },
        content: 'Thrilled to share our latest market insights report. Key takeaway: B2B networks are the future of business growth.',
        mediaUrl: '',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: { likes: 256, comments: 52 },
      },
    ];
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

  private getMockTopThemes(): string[] {
    return [
      'Digital Transformation',
      'Supply Chain Innovation',
      'Global Partnership',
      'Operations Excellence',
      'B2B Growth',
      'Market Expansion',
      'Technology Integration',
      'Business Collaboration',
    ];
  }
}

export const feedService = new FeedService();

