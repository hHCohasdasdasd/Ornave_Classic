import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { PostService } from '../services/postService';
import { CommentService } from '../services/commentService';
import { ApiResponseHandler } from '../utils/apiResponse';

export const postRoutes = Router();

/**
 * Create a new post
 * POST /api/posts
 */
postRoutes.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { title, content, mediaUrl, type, visibility, groupId, mentions, tags } = req.body;

    if (!content || content.trim().length === 0) {
      return ApiResponseHandler.error(res, 'Content is required', undefined, 400);
    }

    const post = await PostService.createPost({
      authorId: req.user.userId,
      title,
      content,
      mediaUrl,
      type: type || 'post',
      visibility: visibility || 'public',
      groupId: groupId || undefined,
      mentions: Array.isArray(mentions) ? mentions : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    return ApiResponseHandler.success(res, post, 'Post created successfully', 201);
  })
);

/**
 * Get feed (all posts)
 * GET /api/posts
 */
postRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const visibility = (req.query.visibility as any) || 'public';
    const theme = req.query.theme as string;
    const tag = req.query.tag as string;

    const result = await PostService.getFeed({
      limit,
      offset,
      visibility,
      theme,
      tag,
    });

    return ApiResponseHandler.success(res, result, 'Feed retrieved successfully', 200);
  })
);

/**
 * Get trending posts from the past week
 * GET /api/posts/trending
 */
postRoutes.get(
  '/trending',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await PostService.getTrendingPosts(limit);

    return ApiResponseHandler.success(
      res,
      posts,
      'Trending posts retrieved successfully',
      200
    );
  })
);

/**
 * Get top themes of the week
 * GET /api/posts/themes
 */
postRoutes.get(
  '/themes',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 8;

    const themes = await PostService.getTopThemes(limit);

    return ApiResponseHandler.success(
      res,
      themes,
      'Top themes retrieved successfully',
      200
    );
  })
);

/**
 * Get user's posts
 * GET /api/posts/user/:userId
 */
postRoutes.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const posts = await PostService.getUserPosts(userId);

    return ApiResponseHandler.success(
      res,
      { items: posts, total: posts.length },
      'User posts retrieved successfully',
      200
    );
  })
);

/**
 * Get a single post
 * GET /api/posts/:postId
 */
postRoutes.get(
  '/:postId',
  asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;

    const post = await PostService.getPost(postId);

    if (!post) {
      return ApiResponseHandler.error(res, 'Post not found', undefined, 404);
    }

    return ApiResponseHandler.success(res, post, 'Post retrieved successfully', 200);
  })
);

/**
 * Delete a post
 * DELETE /api/posts/:postId
 */
postRoutes.delete(
  '/:postId',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { postId } = req.params;

    await PostService.deletePost(postId, req.user.userId);

    return ApiResponseHandler.success(res, {}, 'Post deleted successfully', 200);
  })
);

/**
 * Update post reactions
 * PATCH /api/posts/:postId/reactions
 */
postRoutes.patch(
  '/:postId/reactions',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { postId } = req.params;
    const { reactions } = req.body;

    if (!reactions || typeof reactions.likes !== 'number' || typeof reactions.comments !== 'number') {
      return ApiResponseHandler.error(
        res,
        'Invalid reactions format',
        undefined,
        400
      );
    }

    const post = await PostService.updateReactions(postId, reactions);

    if (!post) {
      return ApiResponseHandler.error(res, 'Post not found', undefined, 404);
    }

    return ApiResponseHandler.success(res, post, 'Reactions updated successfully', 200);
  })
);

/**
 * Get comments for a post
 * GET /api/posts/:postId/comments
 */
postRoutes.get(
  '/:postId/comments',
  asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const comments = await CommentService.getComments(postId);
    return ApiResponseHandler.success(res, comments, 'Comments retrieved successfully', 200);
  })
);

/**
 * Add a comment to a post
 * POST /api/posts/:postId/comments
 */
postRoutes.post(
  '/:postId/comments',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }
    const { postId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return ApiResponseHandler.error(res, 'Content is required', undefined, 400);
    }
    const comment = await CommentService.addComment(postId, req.user.userId, content.trim());
    return ApiResponseHandler.success(res, comment, 'Comment added successfully', 201);
  })
);

export default postRoutes;
