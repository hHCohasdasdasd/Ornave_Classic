import { PrismaClient } from '@prisma/client';
import { stripeClient } from '../utils/stripeClient';

const prisma = new PrismaClient();

function notFound(message: string): Error {
  const error: any = new Error(message);
  error.statusCode = 404;
  return error;
}

export class StripeService {
  /** Every user gets exactly one Stripe Customer, created the first time
   * they try to save a payment method. Everything else (SetupIntents,
   * PaymentIntents, saved PaymentMethods) hangs off this customer. */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await stripeClient.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { ornaveUserId: userId },
    });

    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
    return customer.id;
  }

  /** Starts the "add a payment method" flow — the client_secret the
   * frontend hands to Stripe's own PaymentElement, which collects card or
   * bank details directly in the browser (never touching our server) and
   * supports both types in a single embedded widget. */
  static async createSetupIntent(userId: string): Promise<{ clientSecret: string; customerId: string }> {
    const customerId = await this.getOrCreateCustomer(userId);
    const setupIntent = await stripeClient.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card', 'us_bank_account'],
    });
    if (!setupIntent.client_secret) throw new Error('Stripe did not return a client secret');
    return { clientSecret: setupIntent.client_secret, customerId };
  }

  /** Called after the frontend confirms the SetupIntent — persists the
   * resulting PaymentMethod (already attached to the customer by Stripe)
   * as a SavedCard or SavedBankAccount depending on its type. */
  static async savePaymentMethodFromSetup(userId: string, paymentMethodId: string, makeDefault: boolean) {
    const pm = await stripeClient.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== (await this.getOrCreateCustomer(userId))) {
      throw notFound('Payment method not found');
    }

    if (pm.type === 'card' && pm.card) {
      if (makeDefault) await prisma.savedCard.updateMany({ where: { userId }, data: { isDefault: false } });
      const existingCount = await prisma.savedCard.count({ where: { userId } });
      return prisma.savedCard.create({
        data: {
          userId,
          stripePaymentMethodId: pm.id,
          cardholderName: pm.billing_details.name || 'Cardholder',
          brand: pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1),
          last4: pm.card.last4,
          expiry: `${String(pm.card.exp_month).padStart(2, '0')}/${String(pm.card.exp_year).slice(-2)}`,
          isDefault: makeDefault || existingCount === 0,
        },
      });
    }

    if (pm.type === 'us_bank_account' && pm.us_bank_account) {
      if (makeDefault) await prisma.savedBankAccount.updateMany({ where: { userId }, data: { isDefault: false } });
      const existingCount = await prisma.savedBankAccount.count({ where: { userId } });
      return prisma.savedBankAccount.create({
        data: {
          userId,
          stripePaymentMethodId: pm.id,
          bankName: pm.us_bank_account.bank_name || undefined,
          accountType: pm.us_bank_account.account_type || undefined,
          last4: pm.us_bank_account.last4 || '0000',
          isDefault: makeDefault || existingCount === 0,
        },
      });
    }

    throw new Error(`Unsupported payment method type: ${pm.type}`);
  }

  static async removeCard(userId: string, cardId: string): Promise<void> {
    const card = await prisma.savedCard.findFirst({ where: { id: cardId, userId } });
    if (!card) throw notFound('Card not found');
    await stripeClient.paymentMethods.detach(card.stripePaymentMethodId).catch((err) =>
      console.error(`[Stripe] Failed to detach payment method for card ${cardId}:`, err)
    );
    await prisma.savedCard.delete({ where: { id: cardId } });
  }

  static async removeBankAccount(userId: string, bankAccountId: string): Promise<void> {
    const account = await prisma.savedBankAccount.findFirst({ where: { id: bankAccountId, userId } });
    if (!account) throw notFound('Bank account not found');
    await stripeClient.paymentMethods.detach(account.stripePaymentMethodId).catch((err) =>
      console.error(`[Stripe] Failed to detach payment method for bank account ${bankAccountId}:`, err)
    );
    await prisma.savedBankAccount.delete({ where: { id: bankAccountId } });
  }

  /** Best-effort — called on account deletion (immediately) and by the
   * 30-day purge (as a safety net), same pattern as Plaid's revocation. */
  static async detachAllPaymentMethods(userId: string): Promise<void> {
    const [cards, bankAccounts] = await Promise.all([
      prisma.savedCard.findMany({ where: { userId } }),
      prisma.savedBankAccount.findMany({ where: { userId } }),
    ]);
    for (const card of cards) {
      await stripeClient.paymentMethods.detach(card.stripePaymentMethodId).catch((err) =>
        console.error(`[Stripe] Failed to detach card ${card.id} on account deletion:`, err)
      );
    }
    for (const account of bankAccounts) {
      await stripeClient.paymentMethods.detach(account.stripePaymentMethodId).catch((err) =>
        console.error(`[Stripe] Failed to detach bank account ${account.id} on account deletion:`, err)
      );
    }
    // Same pattern as PlaidService.removeConnection — the local row is
    // meaningless once the credential behind it is revoked, so it goes too
    // rather than lingering until the 30-day purge.
    await prisma.savedCard.deleteMany({ where: { userId } });
    await prisma.savedBankAccount.deleteMany({ where: { userId } });
  }

  /** Charges a saved payment method for an order total. `off_session: true`
   * is the standard pattern for reusing a payment method the customer
   * isn't actively re-entering — it reuses the mandate/authentication
   * collected when the method was originally saved. Cards typically
   * resolve to 'succeeded' immediately; ACH bank debits resolve to
   * 'processing' and settle over the following days, confirmed later by
   * the webhook. */
  static async chargeOrder(params: { userId: string; orderId: string; amount: number; currency: string; paymentMethodId: string }) {
    const customerId = await this.getOrCreateCustomer(params.userId);
    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency.toLowerCase(),
        customer: customerId,
        payment_method: params.paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: { ornaveOrderId: params.orderId },
      });
      return { paymentIntentId: paymentIntent.id, status: paymentIntent.status };
    } catch (err: any) {
      // A decline, an auth-required card, or similar — surface as a failed
      // charge rather than letting the order silently stay unpaid.
      return { paymentIntentId: err?.raw?.payment_intent?.id as string | undefined, status: 'failed', error: err?.message };
    }
  }
}
