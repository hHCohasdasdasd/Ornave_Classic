import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SavedCardResponse {
  id: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expiry: string;
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

function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Card';
}

export class BillingService {
  static async getSavedCards(userId: string): Promise<SavedCardResponse[]> {
    const cards = await prisma.savedCard.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return cards.map((c) => ({
      id: c.id,
      cardholderName: c.cardholderName,
      brand: c.brand,
      last4: c.last4,
      expiry: c.expiry,
      isDefault: c.isDefault,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  static async addSavedCard(userId: string, data: { cardholderName: string; cardNumber: string; expiry: string; makeDefault?: boolean }): Promise<SavedCardResponse> {
    const digits = data.cardNumber.replace(/\s/g, '');
    const last4 = digits.slice(-4);
    const brand = detectCardBrand(digits);

    if (data.makeDefault) {
      await prisma.savedCard.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const existingCount = await prisma.savedCard.count({ where: { userId } });

    const card = await prisma.savedCard.create({
      data: {
        userId,
        cardholderName: data.cardholderName,
        brand,
        last4,
        expiry: data.expiry,
        isDefault: data.makeDefault || existingCount === 0,
      },
    });
    return {
      id: card.id,
      cardholderName: card.cardholderName,
      brand: card.brand,
      last4: card.last4,
      expiry: card.expiry,
      isDefault: card.isDefault,
      createdAt: card.createdAt.toISOString(),
    };
  }

  static async deleteSavedCard(userId: string, cardId: string): Promise<void> {
    await prisma.savedCard.deleteMany({ where: { id: cardId, userId } });
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
