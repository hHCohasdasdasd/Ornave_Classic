import { PrismaClient } from '@prisma/client';
import { stripeClient } from '../utils/stripeClient';
import { TableOrderService, BarTabService } from './workSuiteService';

const prisma = new PrismaClient();

function notFound(message: string): Error {
  const error: any = new Error(message);
  error.statusCode = 404;
  return error;
}

function conflict(message: string): Error {
  const error: any = new Error(message);
  error.statusCode = 409;
  return error;
}

function frontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5175';
}

/** Real card payments for a restaurant/company — as opposed to StripeService,
 * which is an individual user saving a card/bank account of their own.
 * Money charged here settles to the company's own Stripe Connect (Express)
 * account, not ours — we never hold or move their funds ourselves. */
export class StripeConnectService {
  /** Cached flags plus a live sync against Stripe — onboarding status can
   * change on Stripe's side (e.g. they finish a previously-incomplete
   * form, or Stripe asks for more verification) without our DB hearing
   * about it except when asked, so every status check re-syncs. */
  static async getStatus(companyId: string) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (!company.stripeConnectAccountId) {
      return { connected: false, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false, hasTerminalLocation: false };
    }

    const account = await stripeClient.accounts.retrieve(company.stripeConnectAccountId);
    const detailsSubmitted = !!account.details_submitted;
    const chargesEnabled = !!account.charges_enabled;
    const payoutsEnabled = !!account.payouts_enabled;

    await prisma.company.update({
      where: { id: companyId },
      data: {
        stripeConnectDetailsSubmitted: detailsSubmitted,
        stripeConnectChargesEnabled: chargesEnabled,
        stripeConnectPayoutsEnabled: payoutsEnabled,
      },
    });

    return { connected: true, detailsSubmitted, chargesEnabled, payoutsEnabled, hasTerminalLocation: !!company.terminalLocationId };
  }

  /** Creates the Express account the first time (bound to this company for
   * life via metadata + the stored id), then always returns a fresh
   * onboarding link — Account Links expire after a few minutes and can't
   * be reused, so resuming an incomplete onboarding just means calling
   * this again rather than needing separate "start" vs "resume" paths. */
  static async createOnboardingLink(companyId: string) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    let accountId = company.stripeConnectAccountId;

    if (!accountId) {
      const owner = await prisma.user.findFirst({ where: { companyId, role: 'OWNER' }, select: { email: true } });
      const account = await stripeClient.accounts.create({
        type: 'express',
        email: owner?.email,
        business_profile: { name: company.name },
        metadata: { ornaveCompanyId: companyId },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await prisma.company.update({ where: { id: companyId }, data: { stripeConnectAccountId: accountId } });
    }

    const link = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl()}/company-settings?tab=payments&stripe=refresh`,
      return_url: `${frontendUrl()}/company-settings?tab=payments&stripe=return`,
      type: 'account_onboarding',
    });
    return { url: link.url };
  }

  /** Drops the owner straight into Stripe's own Express Dashboard —
   * payout schedule, bank account changes, statements, tax forms —
   * everything Stripe already builds a UI for, so this app doesn't
   * reimplement any of it. Only works once they're actually onboarded. */
  static async createDashboardLink(companyId: string) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (!company.stripeConnectAccountId) throw conflict('Connect a Stripe account first');
    if (!company.stripeConnectDetailsSubmitted) throw conflict('Finish onboarding before opening the dashboard');
    const link = await stripeClient.accounts.createLoginLink(company.stripeConnectAccountId);
    return { url: link.url };
  }

  /** Unlinks the Connect account locally — the Stripe account itself is
   * left alone (someone might reconnect later, or Stripe may still need
   * it for tax records of past charges), same "detach, don't destroy"
   * pattern as StripeService.removeCard. Terminal readers stop working
   * immediately since they're registered under that account. */
  static async disconnect(companyId: string) {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        stripeConnectAccountId: null,
        stripeConnectDetailsSubmitted: false,
        stripeConnectChargesEnabled: false,
        stripeConnectPayoutsEnabled: false,
        terminalLocationId: null,
      },
    });
    await prisma.terminalReader.deleteMany({ where: { companyId } });
  }
}

export interface TerminalAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

/** Stripe Terminal — physical card readers that actually charge a card in
 * person, for the guests who won't be paying via Automatic Check-In. Uses
 * Stripe's server-driven flow (register by code, then push a PaymentIntent
 * to the reader and poll it) rather than the client-side Terminal SDK, so
 * there's no extra browser SDK/WebUSB dependency — just REST calls this
 * backend already knows how to make. */
export class TerminalService {
  private static async requireConnectedCompany(companyId: string) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (!company.stripeConnectAccountId) throw conflict('Connect a Stripe account before setting up card readers');
    return company;
  }

  /** A Terminal Location is required before any reader can be registered
   * to it — created once per company, first time they set up a reader. */
  static async ensureLocation(companyId: string, address: TerminalAddress) {
    const company = await this.requireConnectedCompany(companyId);
    if (company.terminalLocationId) return company.terminalLocationId;

    const location = await stripeClient.terminal.locations.create(
      {
        display_name: company.name,
        address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: address.country,
        },
      },
      { stripeAccount: company.stripeConnectAccountId! },
    );
    await prisma.company.update({ where: { id: companyId }, data: { terminalLocationId: location.id } });
    return location.id;
  }

  /** Registers a physical reader by the code shown on its screen — the
   * standard Stripe Terminal pairing flow. In test mode, the special code
   * "simulated-wpe" registers a simulated reader that can process a full
   * payment flow (including the "present card" wait) without any hardware,
   * which is what lets this be verified end-to-end before real readers
   * are on hand. */
  static async registerReader(companyId: string, registrationCode: string, label: string) {
    const company = await this.requireConnectedCompany(companyId);
    if (!company.terminalLocationId) throw conflict('Set up a card reader location first');

    const reader = await stripeClient.terminal.readers.create(
      {
        registration_code: registrationCode.trim(),
        label: label.trim() || 'Card Reader',
        location: company.terminalLocationId,
      },
      { stripeAccount: company.stripeConnectAccountId! },
    );

    return prisma.terminalReader.create({
      data: {
        companyId,
        stripeReaderId: reader.id,
        label: reader.label || label,
        deviceType: reader.device_type,
        status: reader.status || 'offline',
      },
    });
  }

  /** Every registered reader, with a fresh online/offline status pulled
   * from Stripe — local rows only cache label/deviceType, status is
   * whatever the reader last reported (readers phone home periodically). */
  static async listReaders(companyId: string) {
    const company = await this.requireConnectedCompany(companyId);
    const readers = await prisma.terminalReader.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } });
    if (readers.length === 0) return [];

    const results = await Promise.all(
      readers.map(async (r) => {
        try {
          const live = await stripeClient.terminal.readers.retrieve(r.stripeReaderId, {}, { stripeAccount: company.stripeConnectAccountId! });
          if ('deleted' in live) return r;
          if (live.status !== r.status) await prisma.terminalReader.update({ where: { id: r.id }, data: { status: live.status } });
          return { ...r, status: live.status };
        } catch {
          return r;
        }
      })
    );
    return results;
  }

  static async removeReader(companyId: string, readerId: string) {
    const company = await this.requireConnectedCompany(companyId);
    const reader = await prisma.terminalReader.findFirst({ where: { id: readerId, companyId } });
    if (!reader) throw notFound('Reader not found');
    await stripeClient.terminal.readers.del(reader.stripeReaderId, {}, { stripeAccount: company.stripeConnectAccountId! }).catch(() => {});
    await prisma.terminalReader.delete({ where: { id: reader.id } });
  }

  /** Creates a PaymentIntent for the given amount (already computed
   * server-side from the actual bill, never trusted from the client) and
   * pushes it to the reader — the reader then prompts "Insert or tap
   * card". A direct charge on the connected account, so the money settles
   * straight to the company's own bank, not ours.
   *
   * Ignores whatever currency the caller passes and charges in the
   * connected account's own default currency instead — card_present only
   * supports the currency tied to the account's country (e.g. a
   * Germany-based account can't take a USD card-present charge even
   * though the app's own price fields are just "$12.50" free text with no
   * real currency behind them). */
  static async chargeReader(
    companyId: string,
    readerId: string,
    amount: number,
    _currency: string,
    metadata: Record<string, string>
  ) {
    const company = await this.requireConnectedCompany(companyId);
    const reader = await prisma.terminalReader.findFirst({ where: { id: readerId, companyId } });
    if (!reader) throw notFound('Reader not found');
    if (amount <= 0) throw conflict('Nothing to charge');

    const stripeAccount = company.stripeConnectAccountId!;
    const account = await stripeClient.accounts.retrieve(stripeAccount);
    const currency = account.default_currency || 'usd';
    const paymentIntent = await stripeClient.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency,
        payment_method_types: ['card_present'],
        capture_method: 'automatic',
        metadata: { ...metadata, ornaveCompanyId: companyId },
      },
      { stripeAccount }
    );

    await stripeClient.terminal.readers.processPaymentIntent(
      reader.stripeReaderId,
      { payment_intent: paymentIntent.id },
      { stripeAccount }
    );

    return { paymentIntentId: paymentIntent.id, readerId: reader.id };
  }

  /** Polled by the frontend while the reader is waiting for a card —
   * mirrors the reader's own action status (in_progress while waiting,
   * succeeded/failed once the guest taps/inserts and it clears). */
  static async getPaymentIntentStatus(companyId: string, paymentIntentId: string) {
    const company = await this.requireConnectedCompany(companyId);
    const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId, {}, { stripeAccount: company.stripeConnectAccountId! });
    if (pi.metadata?.ornaveCompanyId !== companyId) throw notFound('Payment not found');
    return { status: pi.status, id: pi.id, metadata: pi.metadata };
  }

  /** Guest declined, walked away, or the reader timed out — clears
   * whatever the reader is currently waiting on so it's ready for the
   * next charge instead of stuck mid-collection. */
  static async cancelReaderAction(companyId: string, readerId: string) {
    const company = await this.requireConnectedCompany(companyId);
    const reader = await prisma.terminalReader.findFirst({ where: { id: readerId, companyId } });
    if (!reader) throw notFound('Reader not found');
    await stripeClient.terminal.readers.cancelAction(reader.stripeReaderId, {}, { stripeAccount: company.stripeConnectAccountId! });
  }

  // --- Server Orders / Bar Orders integration -----------------------------
  // The amount is always computed server-side from the live bill
  // (TableOrderService/BarTabService.getAmountDue), never taken from the
  // client — a Terminal charge can't be tricked into a different total
  // than what the POS screen is actually showing.

  static async chargeForTable(companyId: string, tableId: string, readerId: string, checkId?: string) {
    const { amount, currency } = await TableOrderService.getAmountDue(companyId, tableId, checkId);
    return this.chargeReader(companyId, readerId, amount, currency, { kind: 'table', tableId, checkId: checkId || '' });
  }

  /** Called once the frontend's poll sees the PaymentIntent succeed —
   * re-verifies against Stripe itself (status + the metadata this same
   * charge stamped on) before marking the order paid, so nothing gets
   * marked paid off just a client's say-so. */
  static async completeTableCharge(companyId: string, tableId: string, paymentIntentId: string, checkId?: string) {
    const { status, metadata } = await this.getPaymentIntentStatus(companyId, paymentIntentId);
    if (status !== 'succeeded') throw conflict('This payment has not completed yet');
    if (metadata?.kind !== 'table' || metadata?.tableId !== tableId || (metadata?.checkId || '') !== (checkId || '')) {
      throw conflict('This payment does not match this order');
    }
    return TableOrderService.recordPayment(companyId, tableId, { method: 'CARD_READER', checkId });
  }

  static async chargeForTab(companyId: string, tabId: string, readerId: string, checkId?: string) {
    const { amount, currency } = await BarTabService.getAmountDue(companyId, tabId, checkId);
    return this.chargeReader(companyId, readerId, amount, currency, { kind: 'tab', tabId, checkId: checkId || '' });
  }

  static async completeTabCharge(companyId: string, tabId: string, paymentIntentId: string, checkId?: string) {
    const { status, metadata } = await this.getPaymentIntentStatus(companyId, paymentIntentId);
    if (status !== 'succeeded') throw conflict('This payment has not completed yet');
    if (metadata?.kind !== 'tab' || metadata?.tabId !== tabId || (metadata?.checkId || '') !== (checkId || '')) {
      throw conflict('This payment does not match this order');
    }
    return BarTabService.recordPayment(companyId, tabId, { method: 'CARD_READER', checkId });
  }
}
