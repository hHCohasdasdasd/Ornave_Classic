import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { BillingService } from '../services/billingService';
import { StripeService } from '../services/stripeService';
import { MembershipService } from '../services/membershipService';
import { isStripeConfigured } from '../utils/stripeClient';
import { ApiResponseHandler } from '../utils/apiResponse';

export const billingRoutes = Router();

billingRoutes.use(authMiddleware);

/**
 * Stripe — real payment methods (cards + ACH bank accounts) backing
 * checkout, via Stripe Elements/Financial Connections on the frontend.
 */
billingRoutes.get(
  '/stripe/status',
  asyncHandler(async (_req: any, res: Response) => {
    return ApiResponseHandler.success(res, { configured: isStripeConfigured() }, 'Stripe status retrieved successfully', 200);
  })
);

billingRoutes.post(
  '/stripe/setup-intent',
  asyncHandler(async (req: any, res: Response) => {
    if (!isStripeConfigured()) return ApiResponseHandler.error(res, 'Payments are not configured', undefined, 503);
    const result = await StripeService.createSetupIntent(req.user.userId);
    return ApiResponseHandler.success(res, result, 'Setup intent created successfully', 201);
  })
);

billingRoutes.post(
  '/payment-methods',
  asyncHandler(async (req: any, res: Response) => {
    const { paymentMethodId, makeDefault } = req.body;
    if (!paymentMethodId) {
      return ApiResponseHandler.error(res, 'paymentMethodId is required', undefined, 400);
    }
    const saved = await BillingService.addSavedPaymentMethod(req.user.userId, paymentMethodId, !!makeDefault);
    return ApiResponseHandler.success(res, saved, 'Payment method saved successfully', 201);
  })
);

/**
 * Membership — purchasable profile status tiers (Bronze/Silver/Gold/
 * Diamond) and the standalone Verified add-on, both real Stripe Checkout
 * subscriptions/payments rather than the old localStorage-only stub.
 */
billingRoutes.get(
  '/membership/status',
  asyncHandler(async (req: any, res: Response) => {
    const status = await MembershipService.getStatus(req.user.userId);
    return ApiResponseHandler.success(res, status, 'Membership status retrieved successfully', 200);
  })
);

billingRoutes.post(
  '/membership/downgrade',
  asyncHandler(async (req: any, res: Response) => {
    const status = await MembershipService.downgradeToBasic(req.user.userId);
    return ApiResponseHandler.success(res, status, 'Switched to Basic successfully', 200);
  })
);

billingRoutes.post(
  '/membership/checkout',
  asyncHandler(async (req: any, res: Response) => {
    if (!isStripeConfigured()) return ApiResponseHandler.error(res, 'Payments are not configured', undefined, 503);
    const { tier, billingPeriod } = req.body;
    if (!tier) return ApiResponseHandler.error(res, 'tier is required', undefined, 400);
    try {
      const url = await MembershipService.createTierCheckoutSession(req.user.userId, tier, billingPeriod === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY');
      return ApiResponseHandler.success(res, { url }, 'Checkout session created successfully', 201);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not start checkout', undefined, 400);
    }
  })
);

billingRoutes.post(
  '/membership/verified-checkout',
  asyncHandler(async (req: any, res: Response) => {
    if (!isStripeConfigured()) return ApiResponseHandler.error(res, 'Payments are not configured', undefined, 503);
    const url = await MembershipService.createVerifiedCheckoutSession(req.user.userId);
    return ApiResponseHandler.success(res, { url }, 'Checkout session created successfully', 201);
  })
);

billingRoutes.post(
  '/membership/portal',
  asyncHandler(async (req: any, res: Response) => {
    if (!isStripeConfigured()) return ApiResponseHandler.error(res, 'Payments are not configured', undefined, 503);
    const url = await MembershipService.createPortalSession(req.user.userId);
    return ApiResponseHandler.success(res, { url }, 'Portal session created successfully', 201);
  })
);

billingRoutes.post(
  '/membership/reconcile',
  asyncHandler(async (req: any, res: Response) => {
    const { sessionId } = req.body;
    if (!sessionId) return ApiResponseHandler.error(res, 'sessionId is required', undefined, 400);
    try {
      const status = await MembershipService.reconcileCheckoutSession(req.user.userId, sessionId);
      return ApiResponseHandler.success(res, status, 'Membership reconciled successfully', 200);
    } catch (err: any) {
      return ApiResponseHandler.error(res, err.message || 'Could not verify that checkout session', undefined, 400);
    }
  })
);

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
    const { paymentMethodId, makeDefault } = req.body;
    if (!paymentMethodId) {
      return ApiResponseHandler.error(res, 'paymentMethodId is required', undefined, 400);
    }
    const card = await BillingService.addSavedCard(req.user.userId, paymentMethodId, !!makeDefault);
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
 * Saved bank accounts (ACH)
 */
billingRoutes.get(
  '/bank-accounts',
  asyncHandler(async (req: any, res: Response) => {
    const accounts = await BillingService.getSavedBankAccounts(req.user.userId);
    return ApiResponseHandler.success(res, accounts, 'Saved bank accounts retrieved successfully', 200);
  })
);

billingRoutes.post(
  '/bank-accounts',
  asyncHandler(async (req: any, res: Response) => {
    const { paymentMethodId, makeDefault } = req.body;
    if (!paymentMethodId) {
      return ApiResponseHandler.error(res, 'paymentMethodId is required', undefined, 400);
    }
    const account = await BillingService.addSavedBankAccount(req.user.userId, paymentMethodId, !!makeDefault);
    return ApiResponseHandler.success(res, account, 'Bank account saved successfully', 201);
  })
);

billingRoutes.delete(
  '/bank-accounts/:bankAccountId',
  asyncHandler(async (req: any, res: Response) => {
    await BillingService.deleteSavedBankAccount(req.user.userId, req.params.bankAccountId);
    return ApiResponseHandler.success(res, {}, 'Bank account removed successfully', 200);
  })
);

billingRoutes.patch(
  '/bank-accounts/:bankAccountId/default',
  asyncHandler(async (req: any, res: Response) => {
    await BillingService.setDefaultBankAccount(req.user.userId, req.params.bankAccountId);
    return ApiResponseHandler.success(res, {}, 'Default bank account updated successfully', 200);
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
