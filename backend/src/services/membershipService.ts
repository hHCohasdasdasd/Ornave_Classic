import { PrismaClient } from '@prisma/client';
import { stripeClient } from '../utils/stripeClient';
import { StripeService } from './stripeService';

const prisma = new PrismaClient();

export type MemberTier = 'BASIC' | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';

// Silver and above include the Verified add-on for free — mirrors the
// AUTO_VERIFIED_TIERS list on the frontend's status shop.
const AUTO_VERIFIED_TIERS: MemberTier[] = ['SILVER', 'GOLD', 'DIAMOND'];

const TIER_PRICES: Record<Exclude<MemberTier, 'BASIC'>, { name: string; cents: number }> = {
  BRONZE: { name: 'Bronze Member', cents: 499 },
  SILVER: { name: 'Silver Member', cents: 999 },
  GOLD: { name: 'Gold Member', cents: 1999 },
  DIAMOND: { name: 'Diamond Member', cents: 4999 },
};

const VERIFIED_ADDON_CENTS = 299;

function frontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5175';
}

function isPaidTier(tier: string): tier is Exclude<MemberTier, 'BASIC'> {
  return tier in TIER_PRICES;
}

export class MembershipService {
  static async getStatus(userId: string): Promise<{ memberTier: MemberTier; isVerified: boolean }> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { memberTier: true, isVerified: true } });
    return { memberTier: user.memberTier as MemberTier, isVerified: user.isVerified };
  }

  /** A hosted Stripe Checkout page for subscribing to a paid tier — far
   * simpler and safer than building recurring-billing UI ourselves (Stripe
   * handles SCA, proration on upgrade/downgrade, and renewal retries). */
  static async createTierCheckoutSession(userId: string, tier: string): Promise<string> {
    if (!isPaidTier(tier)) throw new Error(`Not a purchasable tier: ${tier}`);
    const customerId = await StripeService.getOrCreateCustomer(userId);
    const { name, cents } = TIER_PRICES[tier];

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${name} — Ornave Status` },
            unit_amount: cents,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { ornaveUserId: userId, ornaveTier: tier },
      subscription_data: { metadata: { ornaveUserId: userId, ornaveTier: tier } },
      success_url: `${frontendUrl()}/profile/edit?tab=enhance&membership=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl()}/profile/edit?tab=enhance&membership=cancelled`,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return session.url;
  }

  /** Same pattern, one-time payment instead of a subscription. */
  static async createVerifiedCheckoutSession(userId: string): Promise<string> {
    const customerId = await StripeService.getOrCreateCustomer(userId);

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Verified Badge — Ornave' },
            unit_amount: VERIFIED_ADDON_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: { ornaveUserId: userId, ornaveVerifiedAddon: 'true' },
      success_url: `${frontendUrl()}/profile/edit?tab=enhance&membership=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl()}/profile/edit?tab=enhance&membership=cancelled`,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return session.url;
  }

  /** Lets a member manage or cancel their subscription — another hosted
   * Stripe page, no custom cancellation/proration UI needed. */
  static async createPortalSession(userId: string): Promise<string> {
    const customerId = await StripeService.getOrCreateCustomer(userId);
    const session = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl()}/profile/edit?tab=enhance`,
    });
    return session.url;
  }

  /** Called when the frontend lands back on the success URL — gives
   * immediate feedback without waiting on the webhook, which remains the
   * authoritative path (handles renewals/cancellations/failed payments
   * that happen while nobody's looking at this page). Verifies the session
   * actually belongs to this user before trusting it. */
  static async reconcileCheckoutSession(userId: string, sessionId: string): Promise<{ memberTier: MemberTier; isVerified: boolean }> {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.ornaveUserId !== userId) {
      throw new Error('Checkout session does not belong to this user');
    }
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return this.getStatus(userId);
    }

    if (session.mode === 'subscription' && session.metadata?.ornaveTier) {
      await this.applyTier(userId, session.metadata.ornaveTier, typeof session.subscription === 'string' ? session.subscription : session.subscription?.id);
    } else if (session.mode === 'payment' && session.metadata?.ornaveVerifiedAddon === 'true') {
      await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
    }

    return this.getStatus(userId);
  }

  private static async applyTier(userId: string, tier: string, subscriptionId?: string): Promise<void> {
    if (!isPaidTier(tier)) return;
    const data: any = { memberTier: tier, memberTierSubscriptionId: subscriptionId || null };
    if (AUTO_VERIFIED_TIERS.includes(tier)) data.isVerified = true;
    await prisma.user.update({ where: { id: userId }, data });
  }

  /** Webhook: a subscription's status changed (renewed, past due, or
   * canceled — including at period end after a user cancels via the
   * portal). Drops the member back to BASIC once the subscription is no
   * longer active. */
  static async handleSubscriptionUpdated(subscriptionId: string, status: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { memberTierSubscriptionId: subscriptionId } });
    if (!user) return;

    const stillActive = status === 'active' || status === 'trialing';
    if (!stillActive) {
      await prisma.user.update({ where: { id: user.id }, data: { memberTier: 'BASIC', memberTierSubscriptionId: null } });
    }
  }

  /** Webhook: async confirmation that a Checkout Session completed — the
   * reliable path (reconcileCheckoutSession is best-effort, synchronous
   * feedback for the redirect-back page only). */
  static async handleCheckoutCompleted(sessionId: string): Promise<void> {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    const userId = session.metadata?.ornaveUserId;
    if (!userId) return;

    if (session.mode === 'subscription' && session.metadata?.ornaveTier) {
      await this.applyTier(userId, session.metadata.ornaveTier, typeof session.subscription === 'string' ? session.subscription : session.subscription?.id);
    } else if (session.mode === 'payment' && session.metadata?.ornaveVerifiedAddon === 'true') {
      await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
    }
  }

  /** Revokes the subscription immediately at account deletion, same
   * reasoning as bank connections and saved payment methods — no live
   * recurring charge should outlive the account. */
  static async cancelSubscriptionForDeletion(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { memberTierSubscriptionId: true } });
    if (!user?.memberTierSubscriptionId) return;
    await stripeClient.subscriptions.cancel(user.memberTierSubscriptionId).catch((err) =>
      console.error(`[Membership] Failed to cancel subscription ${user.memberTierSubscriptionId} on account deletion:`, err)
    );
  }
}
