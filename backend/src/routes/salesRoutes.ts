import { Router, Response } from 'express';
import { authMiddleware, companyContextMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { DealService } from '../services/dealService';

const router = Router({ mergeParams: true });

/**
 * Sales / Deal Routes
 * Base: /companies/:companyId/deals
 * Private ERP data — every route requires auth + company context.
 */

router.get(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const deals = await DealService.listForCompany(companyId);
    return ApiResponseHandler.success(res, deals, 'Deals retrieved successfully', 200);
  })
);

router.post(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const { name, clientCompany, value, stage, owner, closeDate } = req.body;

    if (!name || !name.trim()) {
      return ApiResponseHandler.error(res, 'Name is required', undefined, 400);
    }

    const deal = await DealService.create(companyId, {
      name: name.trim(),
      clientCompany,
      value: typeof value === 'number' ? value : undefined,
      stage,
      owner,
      closeDate,
    });

    return ApiResponseHandler.success(res, deal, 'Deal created successfully', 201);
  })
);

router.put(
  '/:dealId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, dealId } = req.params as { companyId: string; dealId: string };
    const { name, clientCompany, value, stage, owner, closeDate } = req.body;

    if (name !== undefined && !name.trim()) {
      return ApiResponseHandler.error(res, 'Name cannot be empty', undefined, 400);
    }

    const deal = await DealService.update(companyId, dealId, {
      name,
      clientCompany,
      value,
      stage,
      owner,
      closeDate,
    });

    return ApiResponseHandler.success(res, deal, 'Deal updated successfully', 200);
  })
);

router.delete(
  '/:dealId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, dealId } = req.params as { companyId: string; dealId: string };
    await DealService.delete(companyId, dealId);
    return ApiResponseHandler.success(res, {}, 'Deal deleted successfully', 200);
  })
);

export default router;
