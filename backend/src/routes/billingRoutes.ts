import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { BillingService } from '../services/billingService';
import { ApiResponseHandler } from '../utils/apiResponse';

export const billingRoutes = Router();

billingRoutes.use(authMiddleware);

/**
 * Saved cards
 */
billingRoutes.get(
  '/cards',
  asyncHandler(async (req: any, res: Response) => {
    const cards = await BillingService.getSavedCards(req.user.userId);
    return ApiResponseHandler.success(res, cards, 'Saved cards retrieved successfully', 200);
  })
);

billingRoutes.post(
  '/cards',
  asyncHandler(async (req: any, res: Response) => {
    const { cardholderName, cardNumber, expiry, makeDefault } = req.body;
    if (!cardholderName || !cardNumber || !expiry) {
      return ApiResponseHandler.error(res, 'Cardholder name, card number, and expiry are required', undefined, 400);
    }
    const card = await BillingService.addSavedCard(req.user.userId, { cardholderName, cardNumber, expiry, makeDefault: !!makeDefault });
    return ApiResponseHandler.success(res, card, 'Card saved successfully', 201);
  })
);

billingRoutes.delete(
  '/cards/:cardId',
  asyncHandler(async (req: any, res: Response) => {
    await BillingService.deleteSavedCard(req.user.userId, req.params.cardId);
    return ApiResponseHandler.success(res, {}, 'Card removed successfully', 200);
  })
);

billingRoutes.patch(
  '/cards/:cardId/default',
  asyncHandler(async (req: any, res: Response) => {
    await BillingService.setDefaultCard(req.user.userId, req.params.cardId);
    return ApiResponseHandler.success(res, {}, 'Default card updated successfully', 200);
  })
);

/**
 * Saved addresses
 */
billingRoutes.get(
  '/addresses',
  asyncHandler(async (req: any, res: Response) => {
    const addresses = await BillingService.getSavedAddresses(req.user.userId);
    return ApiResponseHandler.success(res, addresses, 'Saved addresses retrieved successfully', 200);
  })
);

billingRoutes.post(
  '/addresses',
  asyncHandler(async (req: any, res: Response) => {
    const { label, fullName, streetAddress, city, state, postalCode, country, makeDefault } = req.body;
    if (!fullName || !streetAddress) {
      return ApiResponseHandler.error(res, 'Full name and street address are required', undefined, 400);
    }
    const address = await BillingService.addSavedAddress(req.user.userId, {
      label, fullName, streetAddress, city, state, postalCode, country, makeDefault: !!makeDefault,
    });
    return ApiResponseHandler.success(res, address, 'Address saved successfully', 201);
  })
);

billingRoutes.delete(
  '/addresses/:addressId',
  asyncHandler(async (req: any, res: Response) => {
    await BillingService.deleteSavedAddress(req.user.userId, req.params.addressId);
    return ApiResponseHandler.success(res, {}, 'Address removed successfully', 200);
  })
);

billingRoutes.patch(
  '/addresses/:addressId/default',
  asyncHandler(async (req: any, res: Response) => {
    await BillingService.setDefaultAddress(req.user.userId, req.params.addressId);
    return ApiResponseHandler.success(res, {}, 'Default address updated successfully', 200);
  })
);

export default billingRoutes;
