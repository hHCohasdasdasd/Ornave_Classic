import { Request, Response } from 'express';
import { ModuleService } from '../services/moduleService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { z } from 'zod';

/**
 * Module Controller
 * Handles dynamic module management for ERP systems
 * Supports creating, updating, reordering, and toggling module visibility
 */

const CreateModuleSchema = z.object({
  name: z.string().min(1, 'Module name required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const UpdateModuleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

const ReorderModulesSchema = z.object({
  moduleIds: z.array(z.string()),
});

export class ModuleController {
  /**
   * Create new module
   */
  static createModule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = CreateModuleSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const module = await ModuleService.createModule(companyId, validated as any);

      return ApiResponseHandler.success(
        res,
        module,
        'Module created successfully',
        201
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get all modules for company
   */
  static getCompanyModules = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const modules = await ModuleService.getCompanyModules(companyId);

      return ApiResponseHandler.success(res, modules, 'Modules retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get enabled modules only
   */
  static getEnabledModules = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const modules = await ModuleService.getEnabledModules(companyId);

      return ApiResponseHandler.success(res, modules, 'Enabled modules retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Get module by ID
   */
  static getModule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, moduleId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const module = await ModuleService.getModuleById(moduleId, companyId);

      return ApiResponseHandler.success(res, module, 'Module retrieved', 200);
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 404);
    }
  });

  /**
   * Update module
   */
  static updateModule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, moduleId } = req.params;
      const validated = UpdateModuleSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const module = await ModuleService.updateModule(moduleId, companyId, validated);

      return ApiResponseHandler.success(
        res,
        module,
        'Module updated successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Toggle module visibility
   */
  static toggleVisibility = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, moduleId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      const module = await ModuleService.toggleModuleVisibility(moduleId, companyId);

      return ApiResponseHandler.success(
        res,
        module,
        'Module visibility toggled',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Reorder modules
   */
  static reorderModules = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const validated = ReorderModulesSchema.parse(req.body);

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await ModuleService.reorderModules(companyId, validated.moduleIds);

      return ApiResponseHandler.success(
        res,
        null,
        'Modules reordered successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });

  /**
   * Delete module
   */
  static deleteModule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId, moduleId } = req.params;

      if (req.user?.companyId !== companyId) {
        return ApiResponseHandler.error(res, ERROR_MESSAGES.FORBIDDEN, undefined, 403);
      }

      await ModuleService.deleteModule(moduleId, companyId);

      return ApiResponseHandler.success(
        res,
        null,
        'Module deleted successfully',
        200
      );
    } catch (error: any) {
      return ApiResponseHandler.error(res, error.message, undefined, 400);
    }
  });
}
