import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MentionEntry {
  id: string;
  type: 'user' | 'company';
  name: string;
  avatarUrl?: string;
  slug?: string;
}

export interface CreatePostRequest {
  authorId: string;
  title?: string;
  content: string;
  mediaUrl?: string;
  type?: string;
  visibility?: 'public' | 'connections' | 'private';
  groupId?: string;
  linkedPublicationId?: string;
  mentions?: MentionEntry[];
  tags?: string[];
}

const LINKED_PUBLICATION_INCLUDE = {
  linkedPublication: {
    include: { author: { include: { profile: true, company: true } } },
  },
} as const;

export interface PostResponse {
  id: string;
  authorId: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    headline?: string;
    profilePicture?: string;
  };
  title?: string;
  content: string;
  mediaUrl?: string;
  type: string;
  reactions: {
    likes: number;
    comments: number;
  };
  visibility: string;
  timestamp: string;
  isDeleted: boolean;
  groupId?: string | null;
  linkedPublication?: {
    id: string;
    title: string;
    coverImage?: string | null;
    tags: string[];
    authorName: string;
  } | null;
  mentions: MentionEntry[];
  tags: string[];
}

export class PostService {
  private static readonly BUSINESS_THEMES = [
    { keywords: ['partnership', 'partner', 'collaborate'], theme: 'Partnership & Collaboration' },
    { keywords: ['digital', 'transformation', 'innovation'], theme: 'Digital Transformation' },
    { keywords: ['supply chain', 'logistics', 'procurement'], theme: 'Supply Chain' },
    { keywords: ['growth', 'expand', 'market'], theme: 'Growth & Expansion' },
    { keywords: ['technology', 'tech', 'software', 'platform'], theme: 'Technology & Innovation' },
    { keywords: ['efficiency', 'optimize', 'improvement'], theme: 'Operations Excellence' },
    { keywords: ['network', 'community', 'ecosystem'], theme: 'Network & Ecosystem' },
    { keywords: ['business', 'enterprise', 'b2b'], theme: 'Business Solutions' },
  ];

  /**
   * Create a new post
   */
  static async createPost(request: CreatePostRequest): Promise<PostResponse> {
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: request.authorId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        authorId: request.authorId,
        title: request.title,
        content: request.content,
        mediaUrl: request.mediaUrl,
        type: request.type || 'post',
        visibility: request.visibility || 'public',
        reactions: JSON.stringify({ likes: 0, comments: 0 }),
        isDeleted: false,
        groupId: request.groupId,
        linkedPublicationId: request.linkedPublicationId,
        mentions: JSON.stringify(request.mentions || []),
        tags: JSON.stringify((request.tags || []).map((t) => t.toUpperCase())),
      },
      include: LINKED_PUBLICATION_INCLUDE,
    });

    return this.formatPostResponse(post, user);
  }

  /**
   * Get posts for a user
   */
  static async getUserPosts(userId: string): Promise<PostResponse[]> {
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: LINKED_PUBLICATION_INCLUDE,
    });

    // Get user info for all posts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return [];
    }

    return posts.map(post => this.formatPostResponse(post, user));
  }

  /**
   * Get all posts (feed)
   */
  static async getFeed(
    options: {
      limit?: number;
      offset?: number;
      visibility?: 'public' | 'connections' | 'private';
      theme?: string;
      tag?: string;
      groupId?: string | null;
    } = {}
  ): Promise<{ items: PostResponse[]; total: number; hasMore: boolean }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Build where clause
    const where: any = {
      isDeleted: false,
      ...(options.visibility && { visibility: options.visibility }),
      groupId: options.groupId === undefined ? null : options.groupId,
    };

    if (options.tag) {
      where.tags = { contains: options.tag.toUpperCase() };
    }

    if (options.theme) {
      const themeConfig = this.BUSINESS_THEMES.find(t => t.theme === options.theme);
      const keywords = themeConfig ? themeConfig.keywords : [];
      
      where.OR = [
        { content: { contains: `#${options.theme.replace(/\s+/g, '')}` } }, // Search as hashtag
        { content: { contains: options.theme } }, // Search for exact theme name
        ...keywords.map(keyword => ({
          content: { contains: keyword }
        }))
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: LINKED_PUBLICATION_INCLUDE,
    });

    const total = await prisma.post.count({
      where,
    });

    // Get user info for all posts
    const userIds = [...new Set(posts.map(p => p.authorId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const items = posts.map(post => {
      const user = userMap.get(post.authorId);
      return this.formatPostResponse(post, user!);
    });

    return {
      items,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a single post
   */
  static async getPost(postId: string): Promise<PostResponse | null> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: LINKED_PUBLICATION_INCLUDE,
    });

    if (!post || post.isDeleted) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: post.authorId },
      include: { profile: true },
    });

    if (!user) {
      return null;
    }

    return this.formatPostResponse(post, user);
  }

  /**
   * Delete a post (soft delete)
   */
  static async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.authorId !== userId) {
      throw new Error('Unauthorized or post not found');
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });

    return true;
  }

  /**
   * Update reactions on a post
   */
  static async updateReactions(
    postId: string,
    reactions: { likes: number; comments: number }
  ): Promise<PostResponse | null> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      return null;
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        reactions: JSON.stringify(reactions),
      },
      include: LINKED_PUBLICATION_INCLUDE,
    });

    const user = await prisma.user.findUnique({
      where: { id: post.authorId },
      include: { profile: true },
    });

    if (!user) {
      return null;
    }

    return this.formatPostResponse(updated, user);
  }

  /**
   * Get trending posts from the past week
   */
  static async getTrendingPosts(limit: number = 10): Promise<PostResponse[]> {
    // Calculate date from one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        visibility: 'public',
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.max(limit * 5, 100), // Fetch more candidates to find top engaged ones
    });

    // Get user info for all posts
    const userIds = [...new Set(posts.map(p => p.authorId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Sort by engagement (likes + comments)
    const items = posts.map(post => {
      const user = userMap.get(post.authorId);
      let reactions = { likes: 0, comments: 0 };
      try {
        reactions = JSON.parse(post.reactions || '{"likes":0,"comments":0}');
      } catch (e) {
        console.error(`Failed to parse reactions for post ${post.id}:`, e);
      }
      
      return {
        post: this.formatPostResponse(post, user!),
        engagement: (reactions.likes || 0) + (reactions.comments || 0),
      };
    });

    return items
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, limit)
      .map(item => item.post);
  }

  /**
   * Get top themes/themes of the week
   */
  static async getTopThemes(limit: number = 8): Promise<string[]> {
    // Calculate date from one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        visibility: 'public',
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      select: {
        content: true,
      },
    });

    // Extract themes from post content (hashtags and key topics)
    const themeMap = new Map<string, number>();

    posts.forEach(post => {
      // Extract hashtags
      const hashtags = post.content.match(/#[\w]+/g) || [];
      hashtags.forEach(tag => {
        const cleanTag = tag.substring(1); // Remove #
        themeMap.set(cleanTag, (themeMap.get(cleanTag) || 0) + 1);
      });

      // Extract common business themes
      this.BUSINESS_THEMES.forEach(({ keywords, theme }) => {
        const contentLower = post.content.toLowerCase();
        if (keywords.some(keyword => contentLower.includes(keyword))) {
          themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
        }
      });
    });

    // Sort by frequency and return top themes
    const sortedThemes = Array.from(themeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);

    // If not enough themes, add default ones
    const defaultThemes = [
      'Digital Transformation',
      'Supply Chain Innovation',
      'Global Partnership',
      'Operations Excellence',
      'B2B Growth',
      'Market Expansion',
      'Technology Integration',
      'Business Collaboration',
    ];

    return sortedThemes.length >= limit
      ? sortedThemes
      : [...sortedThemes, ...defaultThemes].slice(0, limit);
  }

  /**
   * Format post response
   */
  private static formatPostResponse(post: any, user: any): PostResponse {
    let linkedPublication: PostResponse['linkedPublication'] = null;
    if (post.linkedPublication) {
      const lp = post.linkedPublication;
      let tags: string[] = [];
      try {
        tags = JSON.parse(lp.tags || '[]');
      } catch {
        tags = [];
      }
      linkedPublication = {
        id: lp.id,
        title: lp.title,
        coverImage: lp.coverImage,
        tags,
        authorName: lp.company?.name || `${lp.author.firstName} ${lp.author.lastName}`.trim(),
      };
    }

    let mentions: MentionEntry[] = [];
    try {
      mentions = JSON.parse(post.mentions || '[]');
    } catch {
      mentions = [];
    }

    let tags: string[] = [];
    try {
      tags = JSON.parse(post.tags || '[]');
    } catch {
      tags = [];
    }

    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        headline: user.profile?.headline,
        profilePicture: user.profile?.avatarUrl,
      },
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl,
      type: post.type,
      reactions: JSON.parse(post.reactions || '{"likes":0,"comments":0}'),
      visibility: post.visibility,
      timestamp: post.createdAt.toISOString(),
      isDeleted: post.isDeleted,
      groupId: post.groupId,
      linkedPublication,
      mentions,
      tags,
    };
  }
}
