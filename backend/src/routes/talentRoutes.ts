import { Router, Response } from 'express';
import { authMiddleware, companyContextMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { TalentService } from '../services/talentService';

const router = Router({ mergeParams: true });

/**
 * Talent / Candidate Routes
 * Base: /companies/:companyId/candidates
 * Private ERP data — every route requires auth + company context.
 */

router.get(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const candidates = await TalentService.listForCompany(companyId);
    return ApiResponseHandler.success(res, candidates, 'Candidates retrieved successfully', 200);
  })
);

router.post(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const { name, title, location, skills, experience, availability, saved } = req.body;

    if (!name || !name.trim()) {
      return ApiResponseHandler.error(res, 'Name is required', undefined, 400);
    }

    const candidate = await TalentService.create(companyId, {
      name: name.trim(),
      title,
      location,
      skills: Array.isArray(skills) ? skills : undefined,
      experience,
      availability,
      saved: typeof saved === 'boolean' ? saved : undefined,
    });

    return ApiResponseHandler.success(res, candidate, 'Candidate created successfully', 201);
  })
);

router.put(
  '/:candidateId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, candidateId } = req.params as { companyId: string; candidateId: string };
    const { name, title, location, skills, experience, availability, saved } = req.body;

    if (name !== undefined && !name.trim()) {
      return ApiResponseHandler.error(res, 'Name cannot be empty', undefined, 400);
    }

    const candidate = await TalentService.update(companyId, candidateId, {
      name,
      title,
      location,
      skills: Array.isArray(skills) ? skills : undefined,
      experience,
      availability,
      saved,
    });

    return ApiResponseHandler.success(res, candidate, 'Candidate updated successfully', 200);
  })
);

router.delete(
  '/:candidateId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, candidateId } = req.params as { companyId: string; candidateId: string };
    await TalentService.delete(companyId, candidateId);
    return ApiResponseHandler.success(res, {}, 'Candidate deleted successfully', 200);
  })
);

export default router;
