import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { JobService } from '../services/jobService';

const router = Router();

/**
 * Network-wide Jobs Feed
 * Base: /api/jobs
 * Public "browse all jobs" board across every company — no auth required,
 * distinct from the per-company tenant-isolated job management routes.
 */

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const jobs = await JobService.listAllActiveJobs(Number.isFinite(limit) && limit > 0 ? limit : 50);
    return ApiResponseHandler.success(res, jobs, 'Jobs retrieved successfully', 200);
  })
);

export default router;
