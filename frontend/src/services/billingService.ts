import { apiClient } from './api';

export interface SavedCard {
  id: string;
  stripePaymentMethodId: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SavedBankAccount {
  id: string;
  stripePaymentMethodId: string;
  bankName: string | null;
  accountType: string | null;
  last4: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SavedAddress {
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

export type MemberTier = 'BASIC' | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';

export type BillingPeriod = 'MONTHLY' | 'ANNUAL';

export interface MembershipStatus {
  memberTier: MemberTier;
  isVerified: boolean;
  // Set only while a Silver/Gold/Diamond minimum-commitment window is still
  // running — null once it's passed (or for tiers with no commitment).
  canDowngradeAt: string | null;
  billingPeriod: BillingPeriod | null;
  // Set only when a monthly cancellation has been accepted but deferred to
  // the end of the minimum-commitment window.
  cancelAt: string | null;
}

class BillingService {
  async getStripeStatus(): Promise<{ configured: boolean }> {
    try {
      const response = await apiClient.get('/billing/stripe/status');
      return response.data.data;
    } catch {
      return { configured: false };
    }
  }

  async getMembershipStatus(): Promise<MembershipStatus> {
    const response = await apiClient.get('/billing/membership/status');
    return response.data.data;
  }

  async downgradeToBasic(): Promise<MembershipStatus> {
    const response = await apiClient.post('/billing/membership/downgrade', {});
    return response.data.data;
  }

  async cancelMembership(): Promise<MembershipStatus & { effective: 'immediate' | 'scheduled' | 'none' }> {
    const response = await apiClient.post('/billing/membership/cancel', {});
    return response.data.data;
  }

  async undoCancelMembership(): Promise<MembershipStatus> {
    const response = await apiClient.post('/billing/membership/cancel/undo', {});
    return response.data.data;
  }

  async createTierCheckout(tier: Exclude<MemberTier, 'BASIC'>, billingPeriod: BillingPeriod = 'MONTHLY'): Promise<string> {
    const response = await apiClient.post('/billing/membership/checkout', { tier, billingPeriod });
    return response.data.data.url;
  }

  async createVerifiedCheckout(): Promise<string> {
    const response = await apiClient.post('/billing/membership/verified-checkout', {});
    return response.data.data.url;
  }

  async createMembershipPortal(): Promise<string> {
    const response = await apiClient.post('/billing/membership/portal', {});
    return response.data.data.url;
  }

  async reconcileMembershipCheckout(sessionId: string): Promise<MembershipStatus> {
    const response = await apiClient.post('/billing/membership/reconcile', { sessionId });
    return response.data.data;
  }

  async createSetupIntent(): Promise<{ clientSecret: string; customerId: string }> {
    const response = await apiClient.post('/billing/stripe/setup-intent', {});
    return response.data.data;
  }

  async savePaymentMethod(paymentMethodId: string, makeDefault?: boolean): Promise<{ paymentType: 'card' | 'bank_account'; id: string }> {
    const response = await apiClient.post('/billing/payment-methods', { paymentMethodId, makeDefault });
    return response.data.data;
  }

  async getSavedCards(): Promise<SavedCard[]> {
    try {
      const response = await apiClient.get('/billing/cards');
      return response.data.data || response.data;
    } catch {
      return [];
    }
  }

  async addSavedCard(paymentMethodId: string, makeDefault?: boolean): Promise<SavedCard> {
    const response = await apiClient.post('/billing/cards', { paymentMethodId, makeDefault });
    return response.data.data || response.data;
  }

  async deleteSavedCard(cardId: string): Promise<void> {
    await apiClient.delete(`/billing/cards/${cardId}`);
  }

  async setDefaultCard(cardId: string): Promise<void> {
    await apiClient.patch(`/billing/cards/${cardId}/default`, {});
  }

  async getSavedBankAccounts(): Promise<SavedBankAccount[]> {
    try {
      const response = await apiClient.get('/billing/bank-accounts');
      return response.data.data || response.data;
    } catch {
      return [];
    }
  }

  async addSavedBankAccount(paymentMethodId: string, makeDefault?: boolean): Promise<SavedBankAccount> {
    const response = await apiClient.post('/billing/bank-accounts', { paymentMethodId, makeDefault });
    return response.data.data || response.data;
  }

  async deleteSavedBankAccount(bankAccountId: string): Promise<void> {
    await apiClient.delete(`/billing/bank-accounts/${bankAccountId}`);
  }

  async setDefaultBankAccount(bankAccountId: string): Promise<void> {
    await apiClient.patch(`/billing/bank-accounts/${bankAccountId}/default`, {});
  }

  async getSavedAddresses(): Promise<SavedAddress[]> {
    try {
      const response = await apiClient.get('/billing/addresses');
      return response.data.data || response.data;
    } catch {
      return [];
    }
  }

  async addSavedAddress(data: {
    label?: string;
    fullName: string;
    streetAddress: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    makeDefault?: boolean;
  }): Promise<SavedAddress> {
    const response = await apiClient.post('/billing/addresses', data);
    return response.data.data || response.data;
  }

  async deleteSavedAddress(addressId: string): Promise<void> {
    await apiClient.delete(`/billing/addresses/${addressId}`);
  }

  async setDefaultAddress(addressId: string): Promise<void> {
    await apiClient.patch(`/billing/addresses/${addressId}/default`, {});
  }
}

export const billingService = new BillingService();
