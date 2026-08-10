import { Router, Response } from 'express';
import { authMiddleware, companyContextMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { LeadService } from '../services/leadService';

const router = Router({ mergeParams: true });

/**
 * Leads Routes
 * Base: /companies/:companyId/leads
 * Private ERP data — every route requires auth + company context.
 */

router.get(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const leads = await LeadService.listForCompany(companyId);
    return ApiResponseHandler.success(res, leads, 'Leads retrieved successfully', 200);
  })
);

router.post(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const { name, title, leadCompany, location, industry, connections, mutualConnections, saved } = req.body;

    if (!name || !name.trim()) {
      return ApiResponseHandler.error(res, 'Name is required', undefined, 400);
    }

    const lead = await LeadService.create(companyId, {
      name: name.trim(),
      title,
      leadCompany,
      location,
      industry,
      connections: typeof connections === 'number' ? connections : undefined,
      mutualConnections,
      saved: typeof saved === 'boolean' ? saved : undefined,
    });

    return ApiResponseHandler.success(res, lead, 'Lead created successfully', 201);
  })
);

router.put(
  '/:leadId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, leadId } = req.params as { companyId: string; leadId: string };
    const { name, title, leadCompany, location, industry, connections, mutualConnections, saved } = req.body;

    if (name !== undefined && !name.trim()) {
      return ApiResponseHandler.error(res, 'Name cannot be empty', undefined, 400);
    }

    const lead = await LeadService.update(companyId, leadId, {
      name,
      title,
      leadCompany,
      location,
      industry,
      connections,
      mutualConnections,
      saved,
    });

    return ApiResponseHandler.success(res, lead, 'Lead updated successfully', 200);
  })
);

router.delete(
  '/:leadId',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, leadId } = req.params as { companyId: string; leadId: string };
    await LeadService.delete(companyId, leadId);
    return ApiResponseHandler.success(res, {}, 'Lead deleted successfully', 200);
  })
);

export default router;
