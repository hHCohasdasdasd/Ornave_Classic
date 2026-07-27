import { Router, Request, Response } from 'express';
import { authMiddleware, companyContextMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { JobService } from '../services/jobService';

const router = Router({ mergeParams: true });

/**
 * Job Listing Routes
 * Base: /companies/:companyId/jobs
 */

// List jobs for a company (public)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const jobs = await JobService.listJobsForCompany(companyId);
    return ApiResponseHandler.success(res, jobs, 'Jobs retrieved successfully', 200);
  })
);

// Create a job listing (only the company's own members)
router.post(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const {
      title,
      location,
      type,
      description,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      benefits,
      qualifications,
    } = req.body;

    if (!title || !title.trim()) {
      return ApiResponseHandler.error(res, 'Title is required', undefined, 400);
    }

    const job = await JobService.createJob({
      companyId,
      title: title.trim(),
      location,
      type,
      description,
      salaryMin: typeof salaryMin === 'number' ? salaryMin : undefined,
      salaryMax: typeof salaryMax === 'number' ? salaryMax : undefined,
      salaryCurrency,
      salaryPeriod,
      benefits: Array.isArray(benefits) ? benefits : undefined,
      qualifications: Array.isArray(qualifications) ? qualifications : undefined,
    });

    return ApiResponseHandler.success(res, job, 'Job created successfully', 201);
  })
);

// Delete a job listing (only the company's own members)
router.delete(
  '/:jobId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, jobId } = req.params as { companyId: string; jobId: string };
    await JobService.deleteJob(jobId, companyId);
    return ApiResponseHandler.success(res, {}, 'Job deleted successfully', 200);
  })
);

export default router;
