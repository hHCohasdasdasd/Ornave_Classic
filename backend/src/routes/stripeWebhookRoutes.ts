import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { stripeClient } from '../utils/stripeClient';
import { MembershipService } from '../services/membershipService';

const prisma = new PrismaClient();

export const stripeWebhookRoutes = Router();

/** Stripe posts asynchronous payment outcomes here — card charges usually
 * resolve immediately at checkout, but ACH bank debits stay 'processing'
 * for days and only this webhook ever finds out how they resolved. Must
 * receive the raw, unparsed body (registered before express.json() in
 * index.ts) since Stripe's signature is computed over the exact bytes. */
stripeWebhookRoutes.post('/', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    console.error('[StripeWebhook] Missing webhook secret or signature — rejecting.');
    return res.status(400).send('Webhook not configured');
  }

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err: any) {
    console.error('[StripeWebhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook signature verification failed`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as any;
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { paymentStatus: 'PAID' },
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as any;
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { paymentStatus: 'FAILED' },
        });
        break;
      }
      case 'payment_intent.processing': {
        const pi = event.data.object as any;
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { paymentStatus: 'PROCESSING' },
        });
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await MembershipService.handleCheckoutCompleted(session.id);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await MembershipService.handleSubscriptionUpdated(subscription.id, subscription.status);
        break;
      }
      default:
        break;
    }
    return res.json({ received: true });
  } catch (err) {
    console.error('[StripeWebhook] Failed to process event:', err);
    return res.status(500).send('Webhook handler error');
  }
});

export default stripeWebhookRoutes;
