import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { PublicationService } from '../services/publicationService';
import { PublicationCommentService } from '../services/publicationCommentService';

export const publicationRoutes = Router();

/**
 * Create a publication — a longer-form piece tagged with one or more sectors.
 * Any tag matching a Group's tag makes it surface on that group's page.
 * POST /api/publications
 */
publicationRoutes.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);

    const { title, content, coverImage, tags, visibility, postAsCompany, mentions } = req.body;

    if (!title || !title.trim()) {
      return ApiResponseHandler.error(res, 'Title is required', undefined, 400);
    }
    if (!content || !content.trim()) {
      return ApiResponseHandler.error(res, 'Content is required', undefined, 400);
    }

    const publication = await PublicationService.createPublication({
      authorId: req.user.userId,
      companyId: postAsCompany ? req.user.companyId : null,
      title: title.trim(),
      content,
      coverImage,
      tags: Array.isArray(tags) ? tags : [],
      mentions: Array.isArray(mentions) ? mentions : [],
      visibility: visibility || 'public',
    });

    return ApiResponseHandler.success(res, publication, 'Publication created successfully', 201);
  })
);

/**
 * List publications, optionally filtered by tag or author
 * GET /api/publications
 */
publicationRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const tag = req.query.tag as string | undefined;
    const authorId = req.query.authorId as string | undefined;

    const result = await PublicationService.listPublications({ limit, offset, tag, authorId });
    return ApiResponseHandler.success(res, result, 'Publications retrieved successfully', 200);
  })
);

/**
 * Get the most-used tags across recent public publications
 * GET /api/publications/tags/trending
 */
publicationRoutes.get(
  '/tags/trending',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 8;
    const tags = await PublicationService.getTrendingTags(limit);
    return ApiResponseHandler.success(res, tags, 'Trending tags retrieved successfully', 200);
  })
);

/**
 * Get a single publication
 * GET /api/publications/:id
 */
publicationRoutes.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const publication = await PublicationService.getPublication(req.params.id);
    if (!publication) return ApiResponseHandler.error(res, 'Publication not found', undefined, 404);
    return ApiResponseHandler.success(res, publication, 'Publication retrieved successfully', 200);
  })
);

/**
 * Delete a publication
 * DELETE /api/publications/:id
 */
publicationRoutes.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    await PublicationService.deletePublication(req.params.id, req.user.userId);
    return ApiResponseHandler.success(res, {}, 'Publication deleted successfully', 200);
  })
);

/**
 * Update publication reactions
 * PATCH /api/publications/:id/reactions
 */
publicationRoutes.patch(
  '/:id/reactions',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    const { reactions } = req.body;
    if (!reactions || typeof reactions.likes !== 'number' || typeof reactions.comments !== 'number') {
      return ApiResponseHandler.error(res, 'Invalid reactions format', undefined, 400);
    }
    const publication = await PublicationService.updateReactions(req.params.id, reactions);
    if (!publication) return ApiResponseHandler.error(res, 'Publication not found', undefined, 404);
    return ApiResponseHandler.success(res, publication, 'Reactions updated successfully', 200);
  })
);

/**
 * Get comments for a publication
 * GET /api/publications/:id/comments
 */
publicationRoutes.get(
  '/:id/comments',
  asyncHandler(async (req: Request, res: Response) => {
    const comments = await PublicationCommentService.getComments(req.params.id);
    return ApiResponseHandler.success(res, comments, 'Comments retrieved successfully', 200);
  })
);

/**
 * Add a comment to a publication
 * POST /api/publications/:id/comments
 */
publicationRoutes.post(
  '/:id/comments',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    const { content } = req.body;
    if (!content?.trim()) return ApiResponseHandler.error(res, 'Content is required', undefined, 400);
    const comment = await PublicationCommentService.addComment(req.params.id, req.user.userId, content.trim());
    return ApiResponseHandler.success(res, comment, 'Comment added successfully', 201);
  })
);

export default publicationRoutes;
