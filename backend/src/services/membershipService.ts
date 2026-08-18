import { PrismaClient } from '@prisma/client';
import { stripeClient } from '../utils/stripeClient';
import { StripeService } from './stripeService';

const prisma = new PrismaClient();

export type MemberTier = 'BASIC' | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type BillingPeriod = 'MONTHLY' | 'ANNUAL';

// Silver and above include the Verified add-on for free — mirrors the
// AUTO_VERIFIED_TIERS list on the frontend's status shop.
const AUTO_VERIFIED_TIERS: MemberTier[] = ['SILVER', 'GOLD', 'DIAMOND'];

// Bronze is pay-monthly, cancel anytime. Silver and above require staying
// subscribed for a minimum stretch before switching back to Basic — Ornave
// Status above the entry tier is a real commitment, not a monthly toggle.
// An annual purchase is already a 12-month commitment by construction.
const MINIMUM_COMMITMENT_TIERS: MemberTier[] = ['SILVER', 'GOLD', 'DIAMOND'];
const MINIMUM_COMMITMENT_MONTHS = 3;
const ANNUAL_MONTHS = 12;

// Silver and above only — Bronze doesn't offer an annual option.
const ANNUAL_TIERS: MemberTier[] = ['SILVER', 'GOLD', 'DIAMOND'];

const TIER_PRICES: Record<Exclude<MemberTier, 'BASIC'>, { name: string; cents: number }> = {
  BRONZE: { name: 'Bronze Member', cents: 499 },
  SILVER: { name: 'Silver Member', cents: 999 },
  GOLD: { name: 'Gold Member', cents: 1999 },
  DIAMOND: { name: 'Diamond Member', cents: 4999 },
};

// Roughly "2 months free" versus paying monthly for a year.
const ANNUAL_TIER_PRICES: Record<'SILVER' | 'GOLD' | 'DIAMOND', { name: string; cents: number }> = {
  SILVER: { name: 'Silver Member', cents: 9999 },
  GOLD: { name: 'Gold Member', cents: 19999 },
  DIAMOND: { name: 'Diamond Member', cents: 49999 },
};

const TIER_RANK: Record<MemberTier, number> = { BASIC: 0, BRONZE: 1, SILVER: 2, GOLD: 3, DIAMOND: 4 };

const VERIFIED_ADDON_CENTS = 299;

function frontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5175';
}

function isPaidTier(tier: string): tier is Exclude<MemberTier, 'BASIC'> {
  return tier in TIER_PRICES;
}

function isAnnualTier(tier: string): tier is 'SILVER' | 'GOLD' | 'DIAMOND' {
  return (ANNUAL_TIERS as string[]).includes(tier);
}

/** How many months a tier+period combination locks the member in for — 3
 * for a monthly Silver+ subscription, the full 12 for an annual purchase
 * (which has nothing to "cancel" early anyway, being a single payment). */
function commitmentMonths(tier: MemberTier, billingPeriod: BillingPeriod | null): number | null {
  if (!MINIMUM_COMMITMENT_TIERS.includes(tier)) return null;
  return billingPeriod === 'ANNUAL' ? ANNUAL_MONTHS : MINIMUM_COMMITMENT_MONTHS;
}

function commitmentLockedUntil(tier: MemberTier, startedAt: Date | null, billingPeriod: BillingPeriod | null): Date | null {
  const months = commitmentMonths(tier, billingPeriod);
  if (!startedAt || !months) return null;
  const unlockDate = new Date(startedAt);
  unlockDate.setMonth(unlockDate.getMonth() + months);
  return unlockDate > new Date() ? unlockDate : null;
}

function commitmentLockedError(tier: MemberTier, billingPeriod: BillingPeriod | null, lockedUntil: Date): Error {
  const name = TIER_PRICES[tier as Exclude<MemberTier, 'BASIC'>]?.name || 'This status';
  const dateStr = lockedUntil.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const reason = billingPeriod === 'ANNUAL' ? `is a one-time annual purchase good through ${dateStr}` : `has a ${MINIMUM_COMMITMENT_MONTHS}-month minimum — you can switch away starting ${dateStr}`;
  const err: any = new Error(`${name} ${reason}.`);
  err.statusCode = 400;
  return err;
}

export class MembershipService {
  static async getStatus(userId: string): Promise<{ memberTier: MemberTier; isVerified: boolean; canDowngradeAt: string | null; billingPeriod: BillingPeriod | null }> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { memberTier: true, isVerified: true, memberTierStartedAt: true, memberTierBillingPeriod: true },
    });
    const tier = user.memberTier as MemberTier;
    const billingPeriod = user.memberTierBillingPeriod as BillingPeriod | null;
    const lockedUntil = commitmentLockedUntil(tier, user.memberTierStartedAt, billingPeriod);
    return { memberTier: tier, isVerified: user.isVerified, canDowngradeAt: lockedUntil ? lockedUntil.toISOString() : null, billingPeriod };
  }

  /** A hosted Stripe Checkout page for subscribing to a paid tier — far
   * simpler and safer than building recurring-billing UI ourselves (Stripe
   * handles SCA, proration on upgrade/downgrade, and renewal retries).
   * `billingPeriod: 'ANNUAL'` (Silver and above only) is a one-time
   * 12-month payment instead — no recurring subscription at all. */
  static async createTierCheckoutSession(userId: string, tier: string, billingPeriod: BillingPeriod = 'MONTHLY'): Promise<string> {
    if (!isPaidTier(tier)) throw new Error(`Not a purchasable tier: ${tier}`);
    if (billingPeriod === 'ANNUAL' && !isAnnualTier(tier)) {
      throw new Error('Annual billing is only available for Silver and above');
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { memberTier: true, memberTierStartedAt: true, memberTierBillingPeriod: true } });
    const currentTier = (user?.memberTier as MemberTier) || 'BASIC';
    // Moving to a lower-ranked tier while still under commitment is the same
    // thing as canceling early wearing a different hat — block it exactly
    // like downgradeToBasic does. Upgrading is always allowed.
    if (TIER_RANK[tier] < TIER_RANK[currentTier]) {
      const lockedUntil = commitmentLockedUntil(currentTier, user?.memberTierStartedAt ?? null, user?.memberTierBillingPeriod as BillingPeriod | null);
      if (lockedUntil) throw commitmentLockedError(currentTier, user?.memberTierBillingPeriod as BillingPeriod | null, lockedUntil);
    }

    const customerId = await StripeService.getOrCreateCustomer(userId);

    if (billingPeriod === 'ANNUAL') {
      const { name, cents } = ANNUAL_TIER_PRICES[tier as 'SILVER' | 'GOLD' | 'DIAMOND'];
      const session = await stripeClient.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: `${name} — Ornave Status (1 year)` },
              unit_amount: cents,
            },
            quantity: 1,
          },
        ],
        metadata: { ornaveUserId: userId, ornaveTier: tier, ornaveBillingPeriod: 'ANNUAL' },
        success_url: `${frontendUrl()}/profile/edit?tab=enhance&membership=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl()}/profile/edit?tab=enhance&membership=cancelled`,
      });
      if (!session.url) throw new Error('Stripe did not return a checkout URL');
      return session.url;
    }

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
      metadata: { ornaveUserId: userId, ornaveTier: tier, ornaveBillingPeriod: 'MONTHLY' },
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
  static async reconcileCheckoutSession(userId: string, sessionId: string): Promise<{ memberTier: MemberTier; isVerified: boolean; canDowngradeAt: string | null; billingPeriod: BillingPeriod | null }> {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.ornaveUserId !== userId) {
      throw new Error('Checkout session does not belong to this user');
    }
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return this.getStatus(userId);
    }

    if (session.metadata?.ornaveTier) {
      const billingPeriod = (session.metadata?.ornaveBillingPeriod as BillingPeriod) || 'MONTHLY';
      const subscriptionId = session.mode === 'subscription'
        ? (typeof session.subscription === 'string' ? session.subscription : session.subscription?.id)
        : undefined;
      await this.applyTier(userId, session.metadata.ornaveTier, billingPeriod, subscriptionId);
    } else if (session.mode === 'payment' && session.metadata?.ornaveVerifiedAddon === 'true') {
      await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
    }

    return this.getStatus(userId);
  }

  private static async applyTier(userId: string, tier: string, billingPeriod: BillingPeriod, subscriptionId?: string): Promise<void> {
    if (!isPaidTier(tier)) return;

    // Switching directly from one paid tier/subscription to another (rather
    // than via downgradeToBasic first) creates a brand-new Stripe
    // subscription — without this, the old one would keep billing alongside
    // the new one. Annual purchases have no subscription to worry about.
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { memberTierSubscriptionId: true } });
    if (existing?.memberTierSubscriptionId && existing.memberTierSubscriptionId !== subscriptionId) {
      await stripeClient.subscriptions.cancel(existing.memberTierSubscriptionId).catch((err) => {
        console.error(`[Membership] Failed to cancel previous subscription ${existing.memberTierSubscriptionId} when switching tiers:`, err);
      });
    }

    const data: any = {
      memberTier: tier,
      memberTierSubscriptionId: subscriptionId || null,
      memberTierStartedAt: new Date(),
      memberTierBillingPeriod: billingPeriod,
    };
    if (AUTO_VERIFIED_TIERS.includes(tier)) data.isVerified = true;
    await prisma.user.update({ where: { id: userId }, data });
  }

  /** Webhook: a subscription's status changed (renewed, past due, or
   * canceled — including at period end after a user cancels via the
   * portal). Drops the member back to BASIC once the subscription is no
   * longer active. Annual purchases aren't subscriptions, so this never
   * fires for them — expireAnnualMemberships handles their end-of-term. */
  static async handleSubscriptionUpdated(subscriptionId: string, status: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { memberTierSubscriptionId: subscriptionId } });
    if (!user) return;

    const stillActive = status === 'active' || status === 'trialing';
    if (!stillActive) {
      await prisma.user.update({ where: { id: user.id }, data: { memberTier: 'BASIC', memberTierSubscriptionId: null, memberTierBillingPeriod: null } });
    }
  }

  /** Webhook: async confirmation that a Checkout Session completed — the
   * reliable path (reconcileCheckoutSession is best-effort, synchronous
   * feedback for the redirect-back page only). */
  static async handleCheckoutCompleted(sessionId: string): Promise<void> {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    const userId = session.metadata?.ornaveUserId;
    if (!userId) return;

    if (session.metadata?.ornaveTier) {
      const billingPeriod = (session.metadata?.ornaveBillingPeriod as BillingPeriod) || 'MONTHLY';
      const subscriptionId = session.mode === 'subscription'
        ? (typeof session.subscription === 'string' ? session.subscription : session.subscription?.id)
        : undefined;
      await this.applyTier(userId, session.metadata.ornaveTier, billingPeriod, subscriptionId);
    } else if (session.mode === 'payment' && session.metadata?.ornaveVerifiedAddon === 'true') {
      await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
    }
  }

  /** Runs on a daily interval (see index.ts, same pattern as
   * AccountPurgeService) — annual purchases don't auto-renew and have no
   * Stripe subscription to notify us when they end, so this is the only
   * thing that reverts an expired annual member back to Basic. */
  static async expireAnnualMemberships(): Promise<{ expired: number }> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - ANNUAL_MONTHS);

    const expired = await prisma.user.findMany({
      where: { memberTierBillingPeriod: 'ANNUAL', memberTierStartedAt: { lte: cutoff }, memberTier: { not: 'BASIC' } },
      select: { id: true },
    });
    for (const user of expired) {
      await prisma.user.update({ where: { id: user.id }, data: { memberTier: 'BASIC', memberTierBillingPeriod: null } });
    }
    if (expired.length) console.log(`[Membership] Expired ${expired.length} annual membership(s) back to Basic.`);
    return { expired: expired.length };
  }

  /** Revokes the subscription immediately at account deletion, same
   * reasoning as bank connections and saved payment methods — no live
   * recurring charge should outlive the account. Annual purchases have
   * nothing to revoke (already paid in full, one time). */
  static async cancelSubscriptionForDeletion(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { memberTierSubscriptionId: true } });
    if (!user?.memberTierSubscriptionId) return;
    await stripeClient.subscriptions.cancel(user.memberTierSubscriptionId).catch((err) =>
      console.error(`[Membership] Failed to cancel subscription ${user.memberTierSubscriptionId} on account deletion:`, err)
    );
  }

  /** "Switch to Basic" from the status shop — unlike the Stripe portal's
   * cancel flow (which keeps paid benefits until the period they already
   * paid for ends), this is an explicit, immediate downgrade: the
   * subscription is canceled right now and the tier drops right now,
   * matching how every other tier change in this shop already works. No
   * proration/refund for the unused remainder — same as a normal Stripe
   * subscription cancellation. Blocked entirely during a commitment window
   * (3 months for monthly Silver+, the full year for an annual purchase). */
  static async downgradeToBasic(userId: string): Promise<{ memberTier: MemberTier; isVerified: boolean; canDowngradeAt: string | null; billingPeriod: BillingPeriod | null }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { memberTier: true, memberTierSubscriptionId: true, memberTierStartedAt: true, memberTierBillingPeriod: true },
    });
    const currentTier = (user?.memberTier as MemberTier) || 'BASIC';
    const billingPeriod = user?.memberTierBillingPeriod as BillingPeriod | null;
    const lockedUntil = commitmentLockedUntil(currentTier, user?.memberTierStartedAt ?? null, billingPeriod);
    if (lockedUntil) throw commitmentLockedError(currentTier, billingPeriod, lockedUntil);
    if (user?.memberTierSubscriptionId) {
      await stripeClient.subscriptions.cancel(user.memberTierSubscriptionId).catch((err) => {
        console.error(`[Membership] Failed to cancel subscription ${user.memberTierSubscriptionId} on downgrade:`, err);
      });
    }
    await prisma.user.update({ where: { id: userId }, data: { memberTier: 'BASIC', memberTierSubscriptionId: null, memberTierBillingPeriod: null } });
    return this.getStatus(userId);
  }
}
