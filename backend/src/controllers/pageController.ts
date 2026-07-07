import { Request, Response } from 'express';
import { PageService } from '../services/pageService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ERROR_MESSAGES } from '../constants';
import { z } from 'zod';

/**
 * Page Controller
 * Handles dynamic page builder operations
 * Supports creating, updating, publishing, and reordering pages with custom layouts
 */

const CreatePageSchema = z.object({
  title: z.string().min(1, 'Page title required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  layout: z.object({}).passthrough().optional(),
});

const UpdatePageSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  layout: z.object({}).passthrough().optional(),
  isPublished: z.boolean().optional(),
});

const ReorderPagesSchema = z.object({
  pageIds: z.array(z.string()),
});

export class PageController {
  /**
   * Create new page
   */
  static createPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = CreatePageSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const page = await PageService.createPage(companyId, validated as any);

      return ApiResponseHandler.success(
        res,
        page,
        'Page created successfully',
        201
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get all pages for company
   */
  static getCompanyPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const pages = await PageService.getCompanyPages(companyId);

      return ApiResponseHandler.success(res, pages, 'Pages retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get published pages only
   */
  static getPublishedPages = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;

      const pages = await PageService.getPublishedPages(companyId);

      return ApiResponseHandler.success(res, pages, 'Published pages retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get page by ID
   */
  static getPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, pageId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const page = await PageService.getPageById(pageId, companyId);

      return ApiResponseHandler.success(res, page, 'Page retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Get page by slug
   */
  static getPageBySlug = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { companyId, slug } = req.params;

      const page = await PageService.getPageBySlug(slug, companyId);

      return ApiResponseHandler.success(res, page, 'Page retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Update page
   */
  static updatePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, pageId } = req.params;
      const validated = UpdatePageSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const page = await PageService.updatePage(pageId, companyId, validated);

      return ApiResponseHandler.success(
        res,
        page,
        'Page updated successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Update page layout only
   * Used for page builder operations
   */
  static updatePageLayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, pageId } = req.params;
      const { layout } = req.body;

      if (!layout) {
        return ApiResponseHandler.error(res, 'Layout data required', undefined, 400);
      }

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const page = await PageService.updatePageLayout(pageId, companyId, layout);

      return ApiResponseHandler.success(
        res,
        page,
        'Page layout updated successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Toggle page publish status
   */
  static togglePublish = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, pageId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const page = await PageService.togglePagePublish(pageId, companyId);

      return ApiResponseHandler.success(
        res,
        page,
        'Page publish status toggled',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Reorder pages
   */
  static reorderPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = ReorderPagesSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await PageService.reorderPages(companyId, validated.pageIds);

      return ApiResponseHandler.success(
        res,
        null,
        'Pages reordered successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Delete page
   */
  static deletePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, pageId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await PageService.deletePage(pageId, companyId);

      return ApiResponseHandler.success(
        res,
        null,
        'Page deleted successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });
}
