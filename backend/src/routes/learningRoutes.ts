import { Router, Response } from 'express';
import { authMiddleware, companyContextMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { LearningService } from '../services/learningService';

const router = Router({ mergeParams: true });

/**
 * Learning / Course Routes
 * Base: /companies/:companyId/courses
 * Private ERP data — every route requires auth + company context.
 */

router.get(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const courses = await LearningService.listForCompany(companyId);
    return ApiResponseHandler.success(res, courses, 'Courses retrieved successfully', 200);
  })
);

router.post(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const { title, instructor, category, level, duration, rating, enrolled, progress, saved, thumbnail } = req.body;

    if (!title || !title.trim()) {
      return ApiResponseHandler.error(res, 'Title is required', undefined, 400);
    }

    const course = await LearningService.create(companyId, {
      title: title.trim(),
      instructor,
      category,
      level,
      duration,
      rating: typeof rating === 'number' ? rating : undefined,
      enrolled: typeof enrolled === 'number' ? enrolled : undefined,
      progress: typeof progress === 'number' ? progress : undefined,
      saved: typeof saved === 'boolean' ? saved : undefined,
      thumbnail,
    });

    return ApiResponseHandler.success(res, course, 'Course created successfully', 201);
  })
);

router.put(
  '/:courseId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, courseId } = req.params as { companyId: string; courseId: string };
    const { title, instructor, category, level, duration, rating, enrolled, progress, saved, thumbnail } = req.body;

    if (title !== undefined && !title.trim()) {
      return ApiResponseHandler.error(res, 'Title cannot be empty', undefined, 400);
    }

    const course = await LearningService.update(companyId, courseId, {
      title,
      instructor,
      category,
      level,
      duration,
      rating,
      enrolled,
      progress,
      saved,
      thumbnail,
    });

    return ApiResponseHandler.success(res, course, 'Course updated successfully', 200);
  })
);

router.delete(
  '/:courseId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, courseId } = req.params as { companyId: string; courseId: string };
    await LearningService.delete(companyId, courseId);
    return ApiResponseHandler.success(res, {}, 'Course deleted successfully', 200);
  })
);

export default router;
