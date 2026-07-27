import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { GroupService } from '../services/groupService';
import { PostService } from '../services/postService';
import { PublicationService } from '../services/publicationService';

export const groupRoutes = Router();

/**
 * List all groups (sectors)
 * GET /api/groups
 */
groupRoutes.get(
  '/',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const search = req.query.search as string | undefined;
    const groups = await GroupService.listGroups(req.user?.userId, search);
    return ApiResponseHandler.success(res, groups, 'Groups retrieved successfully', 200);
  })
);

/**
 * Create a new group
 * POST /api/groups
 */
groupRoutes.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);

    const hasProfile = await GroupService.hasCompletedProfile(req.user.userId);
    if (!hasProfile) {
      return ApiResponseHandler.error(res, 'Complete your profile before creating a sector', undefined, 403);
    }

    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return ApiResponseHandler.error(res, 'Group name is required', undefined, 400);
    }

    const group = await GroupService.createGroup({
      name: name.trim(),
      description,
      createdById: req.user.userId,
    });

    return ApiResponseHandler.success(res, group, 'Group created successfully', 201);
  })
);

/**
 * Get a group by slug
 * GET /api/groups/:slug
 */
groupRoutes.get(
  '/:slug',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const group = await GroupService.getGroupBySlug(req.params.slug, req.user?.userId);
    if (!group) return ApiResponseHandler.error(res, 'Group not found', undefined, 404);
    return ApiResponseHandler.success(res, group, 'Group retrieved successfully', 200);
  })
);

/**
 * Get group members
 * GET /api/groups/:slug/members
 */
groupRoutes.get(
  '/:slug/members',
  asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupService.getGroupBySlug(req.params.slug);
    if (!group) return ApiResponseHandler.error(res, 'Group not found', undefined, 404);
    const members = await GroupService.getMembers(group.id);
    return ApiResponseHandler.success(res, members, 'Members retrieved successfully', 200);
  })
);

/**
 * Join a group
 * POST /api/groups/:slug/join
 */
groupRoutes.post(
  '/:slug/join',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    const group = await GroupService.getGroupBySlug(req.params.slug);
    if (!group) return ApiResponseHandler.error(res, 'Group not found', undefined, 404);
    await GroupService.joinGroup(group.id, req.user.userId);
    return ApiResponseHandler.success(res, {}, 'Joined group successfully', 200);
  })
);

/**
 * Leave a group
 * POST /api/groups/:slug/leave
 */
groupRoutes.post(
  '/:slug/leave',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    const group = await GroupService.getGroupBySlug(req.params.slug);
    if (!group) return ApiResponseHandler.error(res, 'Group not found', undefined, 404);
    await GroupService.leaveGroup(group.id, req.user.userId);
    return ApiResponseHandler.success(res, {}, 'Left group successfully', 200);
  })
);

/**
 * Get discussion posts for a group
 * GET /api/groups/:slug/discussions
 */
groupRoutes.get(
  '/:slug/discussions',
  asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupService.getGroupBySlug(req.params.slug);
    if (!group) return ApiResponseHandler.error(res, 'Group not found', undefined, 404);

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await PostService.getFeed({ limit, offset, visibility: 'public', groupId: group.id });
    return ApiResponseHandler.success(res, result, 'Discussions retrieved successfully', 200);
  })
);

/**
 * Post a discussion in a group — anyone signed in can post, no membership required.
 * POST /api/groups/:slug/discussions
 */
groupRoutes.post(
  '/:slug/discussions',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    const group = await GroupService.getGroupBySlug(req.params.slug);
    if (!group) return ApiResponseHandler.error(res, 'Group not found', undefined, 404);

    const { title, content, mediaUrl, linkedPublicationId, mentions } = req.body;
    if (!content || !content.trim()) {
      return ApiResponseHandler.error(res, 'Content is required', undefined, 400);
    }

    const post = await PostService.createPost({
      authorId: req.user.userId,
      title,
      content,
      mediaUrl,
      type: 'post',
      visibility: 'public',
      groupId: group.id,
      linkedPublicationId: linkedPublicationId || undefined,
      mentions: Array.isArray(mentions) ? mentions : [],
    });

    return ApiResponseHandler.success(res, post, 'Discussion posted successfully', 201);
  })
);

/**
 * Get publications tagged with this group's sector — matched by tag, not a
 * direct relation, so a publication can surface in more than one group.
 * GET /api/groups/:slug/publications
 */
groupRoutes.get(
  '/:slug/publications',
  asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupService.getGroupBySlug(req.params.slug);
    if (!group) return ApiResponseHandler.error(res, 'Group not found', undefined, 404);

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await PublicationService.listPublications({ limit, offset, tag: group.tag });
    return ApiResponseHandler.success(res, result, 'Publications retrieved successfully', 200);
  })
);

export default groupRoutes;
