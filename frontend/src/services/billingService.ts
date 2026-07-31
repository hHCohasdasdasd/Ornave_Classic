import { apiClient } from './api';

export interface SavedCard {
  id: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expiry: string;
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

class BillingService {
  async getSavedCards(): Promise<SavedCard[]> {
    try {
      const response = await apiClient.get('/billing/cards');
      return response.data.data || response.data;
    } catch {
      return [];
    }
  }

  async addSavedCard(data: { cardholderName: string; cardNumber: string; expiry: string; makeDefault?: boolean }): Promise<SavedCard> {
    const response = await apiClient.post('/billing/cards', data);
    return response.data.data || response.data;
  }

  async deleteSavedCard(cardId: string): Promise<void> {
    await apiClient.delete(`/billing/cards/${cardId}`);
  }

  async setDefaultCard(cardId: string): Promise<void> {
    await apiClient.patch(`/billing/cards/${cardId}/default`, {});
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
