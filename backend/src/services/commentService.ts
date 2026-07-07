import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CommentResponse {
  id: string;
  postId: string;
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

export class CommentService {
  static async getComments(postId: string): Promise<CommentResponse[]> {
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: { include: { profile: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
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
    postId: string,
    authorId: string,
    content: string
  ): Promise<CommentResponse> {
    const comment = await prisma.comment.create({
      data: { postId, authorId, content },
      include: { author: { include: { profile: true } } },
    });

    // Increment comment count in Post.reactions JSON
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post) {
      const reactions = JSON.parse(post.reactions || '{}');
      reactions.comments = (reactions.comments || 0) + 1;
      await prisma.post.update({
        where: { id: postId },
        data: { reactions: JSON.stringify(reactions) },
      });
    }

    return {
      id: comment.id,
      postId: comment.postId,
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
