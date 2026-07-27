import { PrismaClient } from '@prisma/client';
import { MentionEntry } from './postService';

const prisma = new PrismaClient();

export interface CreatePublicationRequest {
  authorId: string;
  companyId?: string | null;
  title: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  visibility?: 'public' | 'connections' | 'private';
  mentions?: MentionEntry[];
}

export class PublicationService {
  static async createPublication(request: CreatePublicationRequest) {
    const author = await prisma.user.findUnique({
      where: { id: request.authorId },
      include: { profile: true, company: true },
    });
    if (!author) throw new Error('User not found');

    const publication = await prisma.publication.create({
      data: {
        authorId: request.authorId,
        companyId: request.companyId || author.companyId || null,
        title: request.title,
        content: request.content,
        coverImage: request.coverImage,
        tags: JSON.stringify((request.tags || []).map((t) => t.toUpperCase())),
        mentions: JSON.stringify(request.mentions || []),
        visibility: request.visibility || 'public',
        reactions: JSON.stringify({ likes: 0, comments: 0 }),
      },
    });

    return this.formatPublication(publication, author);
  }

  static async listPublications(options: { limit?: number; offset?: number; tag?: string; authorId?: string } = {}) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const where: any = { isDeleted: false, visibility: 'public' };
    if (options.authorId) where.authorId = options.authorId;
    if (options.tag) where.tags = { contains: options.tag.toUpperCase() };

    const publications = await prisma.publication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.publication.count({ where });

    const authorIds = [...new Set(publications.map((p) => p.authorId))];
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      include: { profile: true, company: true },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return {
      items: publications.map((p) => this.formatPublication(p, authorMap.get(p.authorId)!)),
      total,
      hasMore: offset + limit < total,
    };
  }

  static async getPublication(id: string) {
    const publication = await prisma.publication.findUnique({ where: { id } });
    if (!publication || publication.isDeleted) return null;

    const author = await prisma.user.findUnique({
      where: { id: publication.authorId },
      include: { profile: true, company: true },
    });
    if (!author) return null;

    return this.formatPublication(publication, author);
  }

  static async deletePublication(id: string, userId: string) {
    const publication = await prisma.publication.findUnique({ where: { id } });
    if (!publication || publication.authorId !== userId) {
      throw new Error('Unauthorized or publication not found');
    }
    await prisma.publication.update({ where: { id }, data: { isDeleted: true } });
    return true;
  }

  static async updateReactions(id: string, reactions: { likes: number; comments: number }) {
    const publication = await prisma.publication.findUnique({ where: { id } });
    if (!publication || publication.isDeleted) return null;

    const updated = await prisma.publication.update({
      where: { id },
      data: { reactions: JSON.stringify(reactions) },
    });

    const author = await prisma.user.findUnique({
      where: { id: publication.authorId },
      include: { profile: true, company: true },
    });
    if (!author) return null;

    return this.formatPublication(updated, author);
  }

  private static formatPublication(publication: any, author: any) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(publication.tags || '[]');
    } catch {
      tags = [];
    }

    let mentions: MentionEntry[] = [];
    try {
      mentions = JSON.parse(publication.mentions || '[]');
    } catch {
      mentions = [];
    }

    return {
      id: publication.id,
      authorId: publication.authorId,
      companyId: publication.companyId,
      author: {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        headline: author.profile?.headline,
        profilePicture: author.profile?.avatarUrl,
        companyName: author.company?.name,
      },
      title: publication.title,
      content: publication.content,
      coverImage: publication.coverImage,
      tags,
      mentions,
      reactions: JSON.parse(publication.reactions || '{"likes":0,"comments":0}'),
      visibility: publication.visibility,
      timestamp: publication.createdAt.toISOString(),
      isDeleted: publication.isDeleted,
    };
  }
}
