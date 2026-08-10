import { Router, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
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
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      viewerId: req.user?.userId,
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
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await PostService.getTrendingPosts(limit, req.user?.userId);

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
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;

    const posts = await PostService.getUserPosts(userId, req.user?.userId);

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
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { postId } = req.params;

    const post = await PostService.getPost(postId, req.user?.userId);

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
 * Toggle the current user's like on a post
 * POST /api/posts/:postId/like
 */
postRoutes.post(
  '/:postId/like',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const { postId } = req.params;

    try {
      const result = await PostService.toggleLike(postId, req.user.userId);
      return ApiResponseHandler.success(
        res,
        result,
        result.liked ? 'Post liked' : 'Post unliked',
        200
      );
    } catch {
      return ApiResponseHandler.error(res, 'Post not found', undefined, 404);
    }
  })
);

/**
 * Get comments for a post
 * GET /api/posts/:postId/comments
 */
postRoutes.get(
  '/:postId/comments',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
