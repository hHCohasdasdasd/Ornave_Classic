import { Router, Response } from 'express';
import { authMiddleware, companyContextMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { CompanyBillingService } from '../services/companyBillingService';

const router = Router({ mergeParams: true });

/**
 * Company Billing / Invoice Routes
 * Base: /companies/:companyId/invoices
 * Private ERP data — every route requires auth + company context.
 */

router.get(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const invoices = await CompanyBillingService.listForCompany(companyId);
    return ApiResponseHandler.success(res, invoices, 'Invoices retrieved successfully', 200);
  })
);

router.post(
  '/',
  authMiddleware,
  companyContextMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.params as { companyId: string };
    const { description, amount, status, invoiceDate } = req.body;

    if (!description || !description.trim()) {
      return ApiResponseHandler.error(res, 'Description is required', undefined, 400);
    }

    if (typeof amount !== 'number') {
      return ApiResponseHandler.error(res, 'Amount is required', undefined, 400);
    }

    const invoice = await CompanyBillingService.create(companyId, {
      description: description.trim(),
      amount,
      status,
      invoiceDate,
    });

    return ApiResponseHandler.success(res, invoice, 'Invoice created successfully', 201);
  })
);

export default router;
