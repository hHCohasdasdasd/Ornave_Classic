import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PublicationCommentResponse {
  id: string;
  publicationId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    headline?: string;
    profilePicture?: string;
  };
}

export class PublicationCommentService {
  static async getComments(publicationId: string): Promise<PublicationCommentResponse[]> {
    const comments = await prisma.publicationComment.findMany({
      where: { publicationId },
      include: { author: { include: { profile: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      id: c.id,
      publicationId: c.publicationId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: {
        id: c.author.id,
        firstName: c.author.firstName,
        lastName: c.author.lastName,
        headline: c.author.profile?.headline ?? undefined,
        profilePicture: c.author.profile?.avatarUrl ?? undefined,
      },
    }));
  }

  static async addComment(
    publicationId: string,
    authorId: string,
    content: string
  ): Promise<PublicationCommentResponse> {
    const comment = await prisma.publicationComment.create({
      data: { publicationId, authorId, content },
      include: { author: { include: { profile: true } } },
    });

    const publication = await prisma.publication.findUnique({ where: { id: publicationId } });
    if (publication) {
      const reactions = JSON.parse(publication.reactions || '{}');
      reactions.comments = (reactions.comments || 0) + 1;
      await prisma.publication.update({
        where: { id: publicationId },
        data: { reactions: JSON.stringify(reactions) },
      });
    }

    return {
      id: comment.id,
      publicationId: comment.publicationId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
        headline: comment.author.profile?.headline ?? undefined,
        profilePicture: comment.author.profile?.avatarUrl ?? undefined,
      },
    };
  }
}
