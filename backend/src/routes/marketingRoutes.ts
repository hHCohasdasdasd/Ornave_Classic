import { Router, Response } from 'express';
import { authMiddleware, companyContextMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { MarketingService } from '../services/marketingService';

const router = Router({ mergeParams: true });

/**
 * Marketing / Campaign Routes
 * Base: /companies/:companyId/campaigns
 * Private ERP data — every route requires auth + company context.
 */

router.get(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const campaigns = await MarketingService.listForCompany(companyId);
    return ApiResponseHandler.success(res, campaigns, 'Campaigns retrieved successfully', 200);
  })
);

router.post(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const { name, type, status, budget, spent, impressions, clicks, conversions } = req.body;

    if (!name || !name.trim()) {
      return ApiResponseHandler.error(res, 'Name is required', undefined, 400);
    }

    const campaign = await MarketingService.create(companyId, {
      name: name.trim(),
      type,
      status,
      budget: typeof budget === 'number' ? budget : undefined,
      spent: typeof spent === 'number' ? spent : undefined,
      impressions: typeof impressions === 'number' ? impressions : undefined,
      clicks: typeof clicks === 'number' ? clicks : undefined,
      conversions: typeof conversions === 'number' ? conversions : undefined,
    });

    return ApiResponseHandler.success(res, campaign, 'Campaign created successfully', 201);
  })
);

router.put(
  '/:campaignId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, campaignId } = req.params as { companyId: string; campaignId: string };
    const { name, type, status, budget, spent, impressions, clicks, conversions } = req.body;

    if (name !== undefined && !name.trim()) {
      return ApiResponseHandler.error(res, 'Name cannot be empty', undefined, 400);
    }

    const campaign = await MarketingService.update(companyId, campaignId, {
      name,
      type,
      status,
      budget,
      spent,
      impressions,
      clicks,
      conversions,
    });

    return ApiResponseHandler.success(res, campaign, 'Campaign updated successfully', 200);
  })
);

router.delete(
  '/:campaignId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, campaignId } = req.params as { companyId: string; campaignId: string };
    await MarketingService.delete(companyId, campaignId);
    return ApiResponseHandler.success(res, {}, 'Campaign deleted successfully', 200);
  })
);

export default router;
