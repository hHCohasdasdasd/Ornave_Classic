import { PrismaClient } from '@prisma/client';
import { StripeService } from './stripeService';

const prisma = new PrismaClient();

export interface SavedCardResponse {
  id: string;
  // Not a secret — just an identifier scoped to our Stripe customer, inert
  // without the account's secret key. Checkout uses this directly so a
  // charge always targets a real Stripe PaymentMethod rather than one of
  // our own row ids.
  stripePaymentMethodId: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SavedBankAccountResponse {
  id: string;
  stripePaymentMethodId: string;
  bankName: string | null;
  accountType: string | null;
  last4: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SavedAddressResponse {
  id: string;
  label: string | null;
  fullName: string;
  streetAddress: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  isDefault: boolean;
  createdAt: string;
}

export class BillingService {
  /** Used right after the frontend confirms a SetupIntent — the resulting
   * PaymentMethod could be a card or a bank account and the caller doesn't
   * need to know which ahead of time. */
  static async addSavedPaymentMethod(
    userId: string,
    paymentMethodId: string,
    makeDefault?: boolean
  ): Promise<{ paymentType: 'card' | 'bank_account' } & (SavedCardResponse | SavedBankAccountResponse)> {
    const saved: any = await StripeService.savePaymentMethodFromSetup(userId, paymentMethodId, !!makeDefault);
    const isCard = 'brand' in saved;
    return {
      paymentType: isCard ? 'card' : 'bank_account',
      id: saved.id,
      stripePaymentMethodId: saved.stripePaymentMethodId,
      ...(isCard
        ? { cardholderName: saved.cardholderName, brand: saved.brand, last4: saved.last4, expiry: saved.expiry }
        : { bankName: saved.bankName, accountType: saved.accountType, last4: saved.last4 }),
      isDefault: saved.isDefault,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  static async getSavedCards(userId: string): Promise<SavedCardResponse[]> {
    const cards = await prisma.savedCard.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return cards.map((c) => ({
      id: c.id,
      stripePaymentMethodId: c.stripePaymentMethodId,
      cardholderName: c.cardholderName,
      brand: c.brand,
      last4: c.last4,
      expiry: c.expiry,
      isDefault: c.isDefault,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /** The frontend collects card details via Stripe Elements and confirms a
   * SetupIntent itself — the raw card number never reaches this server.
   * This just persists the resulting PaymentMethod. */
  static async addSavedCard(userId: string, paymentMethodId: string, makeDefault?: boolean): Promise<SavedCardResponse> {
    const card: any = await StripeService.savePaymentMethodFromSetup(userId, paymentMethodId, !!makeDefault);
    return {
      id: card.id,
      stripePaymentMethodId: card.stripePaymentMethodId,
      cardholderName: card.cardholderName,
      brand: card.brand,
      last4: card.last4,
      expiry: card.expiry,
      isDefault: card.isDefault,
      createdAt: card.createdAt.toISOString(),
    };
  }

  static async deleteSavedCard(userId: string, cardId: string): Promise<void> {
    await StripeService.removeCard(userId, cardId);
  }

  static async getSavedBankAccounts(userId: string): Promise<SavedBankAccountResponse[]> {
    const accounts = await prisma.savedBankAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return accounts.map((a) => ({
      id: a.id,
      stripePaymentMethodId: a.stripePaymentMethodId,
      bankName: a.bankName,
      accountType: a.accountType,
      last4: a.last4,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  static async addSavedBankAccount(userId: string, paymentMethodId: string, makeDefault?: boolean): Promise<SavedBankAccountResponse> {
    const account: any = await StripeService.savePaymentMethodFromSetup(userId, paymentMethodId, !!makeDefault);
    return {
      id: account.id,
      stripePaymentMethodId: account.stripePaymentMethodId,
      bankName: account.bankName,
      accountType: account.accountType,
      last4: account.last4,
      isDefault: account.isDefault,
      createdAt: account.createdAt.toISOString(),
    };
  }

  static async deleteSavedBankAccount(userId: string, bankAccountId: string): Promise<void> {
    await StripeService.removeBankAccount(userId, bankAccountId);
  }

  static async setDefaultBankAccount(userId: string, bankAccountId: string): Promise<void> {
    await prisma.savedBankAccount.updateMany({ where: { userId }, data: { isDefault: false } });
    await prisma.savedBankAccount.updateMany({ where: { id: bankAccountId, userId }, data: { isDefault: true } });
  }

  static async setDefaultCard(userId: string, cardId: string): Promise<void> {
    await prisma.savedCard.updateMany({ where: { userId }, data: { isDefault: false } });
    await prisma.savedCard.updateMany({ where: { id: cardId, userId }, data: { isDefault: true } });
  }

  static async getSavedAddresses(userId: string): Promise<SavedAddressResponse[]> {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map((a) => ({
      id: a.id,
      label: a.label,
      fullName: a.fullName,
      streetAddress: a.streetAddress,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  static async addSavedAddress(
    userId: string,
    data: { label?: string; fullName: string; streetAddress: string; city?: string; state?: string; postalCode?: string; country?: string; makeDefault?: boolean }
  ): Promise<SavedAddressResponse> {
    if (data.makeDefault) {
      await prisma.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const existingCount = await prisma.savedAddress.count({ where: { userId } });

    const address = await prisma.savedAddress.create({
      data: {
        userId,
        label: data.label,
        fullName: data.fullName,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.makeDefault || existingCount === 0,
      },
    });
    return {
      id: address.id,
      label: address.label,
      fullName: address.fullName,
      streetAddress: address.streetAddress,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
    };
  }

  static async deleteSavedAddress(userId: string, addressId: string): Promise<void> {
    await prisma.savedAddress.deleteMany({ where: { id: addressId, userId } });
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await prisma.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    await prisma.savedAddress.updateMany({ where: { id: addressId, userId }, data: { isDefault: true } });
  }
}
