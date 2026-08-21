import { apiClient } from './api';
import { FirmProfileData, FirmMenuItem, FirmFloorPlan, FirmTableAvailabilitySlot, FirmMyReservation, FirmTableOrder } from '@/types/firm';
import { getFirmLayoutTemplate } from '@/utils/businessType';
import { TableReservationDetail } from './workSuiteService';

const DEFAULT_LISTINGS = [
  { id: 'listing-1', address: '124 Maple Street', city: 'Springfield', price: '$425,000', beds: 3, baths: 2, sqft: 1650, status: 'For Sale' as const },
  { id: 'listing-2', address: '87 Riverside Ave, Unit 4B', city: 'Springfield', price: '$2,400/mo', beds: 2, baths: 1, sqft: 950, status: 'For Rent' as const },
  { id: 'listing-3', address: '19 Oakwood Court', city: 'Springfield', price: '$610,000', beds: 4, baths: 3, sqft: 2400, status: 'Pending' as const },
];

const FOLLOWED_FIRMS_KEY = 'ornave_followed_firms';
const REGISTERED_FIRMS_KEY = 'ornave_registered_firms';
const FIRM_FOLLOWERS_KEY = 'ornave_firm_followers_registry';
const PARTNERED_FIRMS_KEY = 'ornave_partnered_firms';

class FirmService {
  private getStoredRegisteredFirms(): any[] {
    const stored = localStorage.getItem(REGISTERED_FIRMS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async registerFirmGlobally(firm: any): Promise<void> {
    const firms = this.getStoredRegisteredFirms();
    const index = firms.findIndex(f => f.id === firm.id || f.slug === firm.slug);
    if (index === -1) {
      firms.push({
        ...firm,
        id: firm.id || firm.slug,
        connectionCount: firm.connectionCount || 0,
        type: 'firm'
      });
      localStorage.setItem(REGISTERED_FIRMS_KEY, JSON.stringify(firms));
      window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'firm_registered', id: firm.id } }));
    } else if (firms[index].industry !== firm.industry) {
      // Keep this browser's cached copy in sync with the real persisted
      // industry — otherwise a stale/missing value cached before this fix
      // (or from a different browser) would never self-correct.
      firms[index] = { ...firms[index], ...firm, connectionCount: firms[index].connectionCount || 0 };
      localStorage.setItem(REGISTERED_FIRMS_KEY, JSON.stringify(firms));
      window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'firm_registered', id: firm.id } }));
    }
  }

  async getRegisteredFirms(): Promise<any[]> {
    return this.getStoredRegisteredFirms();
  }

  private getStoredFollows(): any[] {
    const stored = localStorage.getItem(FOLLOWED_FIRMS_KEY);
    if (!stored) {
      // Seed initial data
      const initial = [
        {
          id: 'global-logilink',
          name: 'Global LogiLink',
          headline: 'Next-Generation Logistics & Supply Chain',
          location: 'New York, USA',
          type: 'firm'
        },
        {
          id: 'novatech-robotics',
          name: 'NovaTech Robotics',
          headline: 'Precision Manufacturing Automation',
          location: 'Nagoya, Japan',
          type: 'firm'
        }
      ];
      localStorage.setItem(FOLLOWED_FIRMS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  }

  async getFollowedFirms(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.getStoredFollows();
  }

  /** A verified company's public directory listing — works for any real
   * registered firm, not just ones this browser has personally logged into
   * or discovered before (unlike the localStorage-cached registry below). */
  async getPublicCompanyProfile(companyId: string): Promise<{ id: string; name: string; slug: string; description?: string; logo?: string; industry?: string; about?: string; website?: string } | null> {
    try {
      const response = await apiClient.get(`/network/directory/companies/${companyId}`);
      const data = response.data.data || response.data;
      if (!data?.company) return null;
      return {
        id: data.company.id,
        name: data.company.name,
        slug: data.company.slug,
        description: data.company.description,
        logo: data.company.logo,
        industry: data.industry,
        about: data.about,
        website: data.website,
      };
    } catch {
      return null;
    }
  }

  /** Real, company-managed menu items (Work Suite → Menu) — no auth, no
   * verification gate, only ever what's actually marked available. */
  async getMenuItems(companyId: string, options: { includeUnavailable?: boolean } = {}): Promise<FirmMenuItem[]> {
    try {
      const response = await apiClient.get(`/network/companies/${companyId}/menu`, {
        params: options.includeUnavailable ? { includeUnavailable: 'true' } : undefined,
      });
      const items = response.data.data || [];
      return items.map((i: any) => ({ id: i.id, name: i.name, description: i.description || undefined, price: i.price, category: i.category, isAvailable: i.isAvailable !== false }));
    } catch {
      return [];
    }
  }

  /** The saved Work Suite floor plan (tables/chairs/walls) — no auth, same
   * public read-only pattern as getMenuItems above. */
  async getFloorPlan(companyId: string): Promise<FirmFloorPlan> {
    try {
      const response = await apiClient.get(`/network/companies/${companyId}/floor-plan`);
      const data = response.data.data || {};
      return { tables: data.tables || [], chairs: data.chairs || [], walls: data.walls || [] };
    } catch {
      return { tables: [], chairs: [], walls: [] };
    }
  }

  /** Upcoming booked time slots for one table — public, used to grey out
   * already-taken times while a visitor is picking a slot. */
  async getTableAvailability(companyId: string, tableId: string): Promise<FirmTableAvailabilitySlot[]> {
    try {
      const response = await apiClient.get(`/network/companies/${companyId}/tables/${tableId}/reservations`);
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  async getCompanyBasicInfo(companyId: string): Promise<{ id: string; name: string } | null> {
    try {
      const response = await apiClient.get(`/network/companies/${companyId}/basic-info`);
      return response.data.data;
    } catch {
      return null;
    }
  }

  /** Public table-side order — null means no active reservation for this
   * table right now (guest should ask staff for help), distinct from an
   * empty order (active reservation, nothing ordered yet). */
  async getTableOrder(companyId: string, tableId: string): Promise<FirmTableOrder | null> {
    try {
      const response = await apiClient.get(`/network/companies/${companyId}/tables/${tableId}/order`);
      return response.data.data;
    } catch {
      return null;
    }
  }

  async addOrderItem(companyId: string, tableId: string, data: { menuItemId: string; quantity?: number; note?: string }): Promise<void> {
    try {
      await apiClient.post(`/network/companies/${companyId}/tables/${tableId}/order/items`, data);
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Could not add that item');
    }
  }

  async removeOrderItem(companyId: string, tableId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/network/companies/${companyId}/tables/${tableId}/order/items/${itemId}`);
  }

  /** Book a table for a date/time. Requires an authenticated personal user
   * — throws with the server's message (e.g. a slot conflict) on failure so
   * the caller can show it. */
  async reserveTable(companyId: string, tableId: string, data: { reservationTime: string; partySize: number; note?: string; autoCheckIn?: boolean }): Promise<void> {
    try {
      await apiClient.post(`/network/companies/${companyId}/tables/${tableId}/reservations`, data);
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Could not reserve table');
    }
  }

  async getMyReservations(companyId: string): Promise<FirmMyReservation[]> {
    try {
      const response = await apiClient.get(`/network/companies/${companyId}/my-reservations`);
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  async cancelReservation(id: string): Promise<void> {
    await apiClient.delete(`/network/reservations/${id}`);
  }

  async getReservation(id: string): Promise<TableReservationDetail | null> {
    try {
      const response = await apiClient.get(`/network/reservations/${id}`);
      return response.data.data;
    } catch {
      return null;
    }
  }

  async setAutoCheckIn(id: string, enabled: boolean): Promise<TableReservationDetail> {
    try {
      const response = await apiClient.patch(`/network/reservations/${id}/auto-check-in`, { enabled });
      return response.data.data;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Could not update automatic check-in');
    }
  }

  async getFirmProfile(slug: string): Promise<FirmProfileData | null> {
    const registeredFirms = this.getStoredRegisteredFirms();
    const key = decodeURIComponent(slug).toLowerCase().trim();
    const slugKey = key.replace(/\s+/g, '-');

    let registered = registeredFirms.find(f => {
      const fId = (f.id || '').toLowerCase();
      const fSlug = (f.slug || '').toLowerCase();
      const fName = (f.name || '').toLowerCase();
      const fNameSlug = fName.replace(/\s+/g, '-');

      return fId === key || fId === slugKey ||
             fSlug === key || fSlug === slugKey ||
             fName === key || fNameSlug === slugKey;
    });

    // Not a firm this browser has seen before (logged into, or browsed via
    // the directory) — try the public directory API before giving up.
    if (!registered) {
      const publicProfile = await this.getPublicCompanyProfile(slug);
      if (publicProfile) {
        registered = {
          id: publicProfile.id,
          slug: publicProfile.slug,
          name: publicProfile.name,
          description: publicProfile.about || publicProfile.description,
          logo: publicProfile.logo,
          industry: publicProfile.industry,
          website: publicProfile.website,
          connectionCount: 0,
        };
      }
    }

    if (registered) {
      const template = getFirmLayoutTemplate(registered.industry);
      const base: FirmProfileData = {
        id: registered.id,
        name: registered.name,
        bio: registered.description || `Leading innovation in ${registered.industry || 'our industry'}.`,
        industry: registered.industry,
        tagline: registered.industry,
        firmType: registered.industry === 'Professional Services' ? 'SERVICE' : 'PRODUCT',
        services: [],
        jobs: [],
        followersCount: registered.connectionCount || 0,
        team: [
          { name: 'Founding Member', role: 'Executive', avatar: '👤', profileSlug: '#' }
        ],
        locations: [
          { city: 'Global', address: 'Digital Headquarters', type: 'HQ' }
        ],
        insights: {
          employeeGrowth: '+5%',
          avgTenure: '3.2 years'
        }
      };

      if (template === 'restaurant') {
        return {
          ...base,
          services: [
            { title: 'Dine-In', description: 'Reserve a table and enjoy the full menu on-site.' },
            { title: 'Takeout & Delivery', description: 'Order ahead for pickup or delivery to your door.' },
            { title: 'Private Events & Catering', description: 'Book the space or have us cater your next event.' },
          ],
          menu: await this.getMenuItems(registered.id),
          floorPlan: await this.getFloorPlan(registered.id),
        };
      }

      if (template === 'real-estate') {
        return {
          ...base,
          services: [
            { title: 'Buying', description: 'Guided search and negotiation support for homebuyers.' },
            { title: 'Selling', description: 'Full-service listing, staging, and marketing.' },
            { title: 'Property Management', description: 'End-to-end management for rental portfolios.' },
          ],
          listings: DEFAULT_LISTINGS,
        };
      }

      return {
        ...base,
        services: [
          { title: 'Core Solutions', description: `Standard ${registered.industry} offerings.` },
          { title: 'Enterprise Support', description: '24/7 priority assistance and integration help.' },
        ],
      };
    }

    // No registered/real firm found for this slug.
    return null;
  }

  async followFirm(firm: any): Promise<boolean> {
    try {
      const follows = this.getStoredFollows();
      if (!follows.find(f => f.id === firm.id)) {
        // Ensure we store essential display fields
        const firmToStore = {
          id: firm.id,
          name: firm.name || `${firm.firstName || ''} ${firm.lastName || ''}`.trim() || firm.id,
          headline: firm.headline || 'Professional Entity',
          location: firm.location || 'Global',
          type: 'firm'
        };
        follows.push(firmToStore);
        localStorage.setItem(FOLLOWED_FIRMS_KEY, JSON.stringify(follows));

        // Update global followers registry
        const registry = JSON.parse(localStorage.getItem(FIRM_FOLLOWERS_KEY) || '{}');
        if (!registry[firm.id]) registry[firm.id] = [];
        
        const currentUserRaw = localStorage.getItem('ornave_user');
        if (currentUserRaw) {
          const user = JSON.parse(currentUserRaw);
          const userFollower = {
            id: user.id || 'current-user',
            name: `${user.firstName} ${user.lastName}`,
            headline: user.headline || 'Active Professional',
            location: user.location || 'Global',
            type: 'user'
          };
          if (!registry[firm.id].find((f: any) => f.id === userFollower.id)) {
            registry[firm.id].push(userFollower);
            localStorage.setItem(FIRM_FOLLOWERS_KEY, JSON.stringify(registry));
          }
        }

        window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'firm_follow', id: firm.id } }));
      }
      return true;
    } catch {
      return false;
    }
  }

  async unfollowFirm(firmId: string): Promise<boolean> {
    try {
      const follows = this.getStoredFollows();
      const updated = follows.filter(f => f.id !== firmId);
      localStorage.setItem(FOLLOWED_FIRMS_KEY, JSON.stringify(updated));

      // Update global followers registry
      const registry = JSON.parse(localStorage.getItem(FIRM_FOLLOWERS_KEY) || '{}');
      if (registry[firmId]) {
        const currentUserRaw = localStorage.getItem('ornave_user');
        if (currentUserRaw) {
          const user = JSON.parse(currentUserRaw);
          const userId = user.id || 'current-user';
          registry[firmId] = registry[firmId].filter((f: any) => f.id !== userId);
          localStorage.setItem(FIRM_FOLLOWERS_KEY, JSON.stringify(registry));
        }
      }

      window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'firm_unfollow', id: firmId } }));
      return true;
    } catch {
      return false;
    }
  }

  async isFollowing(firmId: string): Promise<boolean> {
    const follows = this.getStoredFollows();
    return follows.some(f => f.id === firmId);
  }

  // ── Partnered: a deeper tier that requires already Following the firm ──

  private getStoredPartners(): any[] {
    const stored = localStorage.getItem(PARTNERED_FIRMS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  async getPartneredFirms(): Promise<any[]> {
    return this.getStoredPartners();
  }

  async isPartneredWithFirm(firmId: string): Promise<boolean> {
    return this.getStoredPartners().some(f => f.id === firmId);
  }

  /** Deepen an existing Follow into a Partnership. Requires already following the firm. */
  async partnerFirm(firm: any): Promise<boolean> {
    try {
      const isFollowing = await this.isFollowing(firm.id);
      if (!isFollowing) {
        throw new Error('You must follow this firm before partnering with it');
      }

      const partners = this.getStoredPartners();
      if (!partners.find(f => f.id === firm.id)) {
        partners.push({
          id: firm.id,
          name: firm.name || `${firm.firstName || ''} ${firm.lastName || ''}`.trim() || firm.id,
          headline: firm.headline || 'Professional Entity',
          location: firm.location || 'Global',
          type: 'firm',
          partneredAt: new Date().toISOString(),
        });
        localStorage.setItem(PARTNERED_FIRMS_KEY, JSON.stringify(partners));
        window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'firm_partner', id: firm.id } }));
      }
      return true;
    } catch {
      return false;
    }
  }

  async unpartnerFirm(firmId: string): Promise<boolean> {
    try {
      const partners = this.getStoredPartners();
      const updated = partners.filter(f => f.id !== firmId);
      localStorage.setItem(PARTNERED_FIRMS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ornave_state_update', { detail: { type: 'firm_unpartner', id: firmId } }));
      return true;
    } catch {
      return false;
    }
  }
}

export const firmService = new FirmService();
