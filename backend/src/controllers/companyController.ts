import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { ModuleService } from '../services/moduleService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, COMPANY_CONSTANTS } from '../constants';
import { z } from 'zod';

/**
 * Company Controller
 * Handles company creation, settings, and multi-tenant operations
 */

const CreateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  slug: z.string().regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Invalid slug format').optional(),
  description: z.string().optional(),
});

const UpdateSettingsSchema = z.object({
  customConfig: z.object({}).passthrough().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

const UpdateBannerSchema = z.object({
  bannerUrl: z.string().url().max(2000).nullable(),
});

const UpdateLogoSchema = z.object({
  logo: z.string().url().max(2000).nullable(),
});

export class CompanyController {
  /**
   * Create new company
   * Returns company ID, slug, and API token
   */
  static createCompany = asyncHandler(async (req: Request, res: Response) => {
    try {
      const validated = CreateCompanySchema.parse(req.body);
      const company = await CompanyService.createCompany(validated as any);

      // Initialize default modules
      await ModuleService.initializeDefaultModules(company.id);

      return ApiResponseHandler.success(
        res,
        company,
        SUCCESS_MESSAGES.COMPANY_CREATED,
        201
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get company details
   */
  static getCompany = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const company = await CompanyService.getCompanyById(companyId);

      return ApiResponseHandler.success(res, company, 'Company retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, error.statusCode || 400);
    }
  });

  /**
   * Get company by slug (public)
   */
  static getCompanyBySlug = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const company = await CompanyService.getCompanyBySlug(slug);

      return ApiResponseHandler.success(res, company, 'Company retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Update company settings
   */
  static updateSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = UpdateSettingsSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const settings = await CompanyService.updateCompanySettings(companyId, validated);

      return ApiResponseHandler.success(
        res,
        settings,
        'Settings updated successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Update the company's banner (cover) image — a plain image URL rather
   * than a file-upload pipeline.
   */
  static updateBanner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { bannerUrl } = UpdateBannerSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const company = await CompanyService.updateBanner(companyId, bannerUrl);

      return ApiResponseHandler.success(res, company, 'Banner updated successfully', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Update the company's logo — despite the field existing (and being
   * displayed everywhere: firm cards, directory results, connection
   * headers), no endpoint ever let a company actually set it.
   */
  static updateLogo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { logo } = UpdateLogoSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const company = await CompanyService.updateLogo(companyId, logo);

      return ApiResponseHandler.success(res, company, 'Logo updated successfully', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get all company users
   */
  static getCompanyUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const users = await CompanyService.getCompanyUsers(companyId);

      return ApiResponseHandler.success(res, users, 'Users retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Regenerate company API token
   * Security measure - invalidates old token
   */
  static regenerateToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      // Only company owner can regenerate token
      if (req.user?.role !== 'OWNER') {
        return ApiResponseHandler.error(
          res,
          'Only company owner can regenerate token',
          undefined,
          403
        );
      }

      const newToken = await CompanyService.regenerateCompanyToken(companyId);

      return ApiResponseHandler.success(
        res,
        { companyToken: newToken },
        'Token regenerated successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Deactivate company
   */
  static deactivateCompany = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      // Only company owner can deactivate
      if (req.user?.role !== 'OWNER') {
        return ApiResponseHandler.error(
          res,
          'Only company owner can deactivate company',
          undefined,
          403
        );
      }

      await CompanyService.deactivateCompany(companyId);

      return ApiResponseHandler.success(
        res,
        null,
        'Company deactivated successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });
}
