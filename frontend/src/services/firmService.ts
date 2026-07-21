import { apiClient } from './api';
import { FirmProfileData } from '@/types/firm';
import { mockFirmProfiles } from '@/data/mockFirmProfiles';
import { getFirmLayoutTemplate } from '@/utils/businessType';

const DEFAULT_MENU_ITEMS = [
  { id: 'menu-1', name: 'House Salad', description: 'Seasonal greens, shaved parmesan, citrus vinaigrette.', price: '$12', category: 'Starters' },
  { id: 'menu-2', name: 'Soup of the Day', description: "Ask your server what's fresh today.", price: '$9', category: 'Starters' },
  { id: 'menu-3', name: 'Signature Pasta', description: 'Hand-rolled pasta with a slow-simmered sauce.', price: '$24', category: 'Mains' },
  { id: 'menu-4', name: 'Grilled Catch of the Day', description: 'Market fish, seasonal vegetables, herb butter.', price: '$28', category: 'Mains' },
  { id: 'menu-5', name: 'Wood-Fired Pizza', description: 'San Marzano tomato, fresh mozzarella, basil.', price: '$18', category: 'Mains' },
  { id: 'menu-6', name: "Chef's Dessert", description: "Ask your server for tonight's selection.", price: '$10', category: 'Desserts' },
];

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
    if (!firms.find(f => f.id === firm.id || f.slug === firm.slug)) {
      firms.push({
        ...firm,
        id: firm.id || firm.slug,
        connectionCount: firm.connectionCount || 0,
        type: 'firm'
      });
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
          id: 'global-logistics-corp', 
          name: 'Global Logistics Corp', 
          headline: 'End-to-End Supply Chain Solutions', 
          location: 'New York, USA',
          type: 'firm'
        },
        { 
          id: 'abibas', 
          name: 'Abibas Official', 
          headline: 'Global Sports Innovation Leader', 
          location: 'Herzogenaurach, Germany',
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

  async getFirmProfile(slug: string): Promise<FirmProfileData> {
    const registeredFirms = this.getStoredRegisteredFirms();
    const key = decodeURIComponent(slug).toLowerCase().trim();
    const slugKey = key.replace(/\s+/g, '-');

    const registered = registeredFirms.find(f => {
      const fId = (f.id || '').toLowerCase();
      const fSlug = (f.slug || '').toLowerCase();
      const fName = (f.name || '').toLowerCase();
      const fNameSlug = fName.replace(/\s+/g, '-');

      return fId === key || fId === slugKey || 
             fSlug === key || fSlug === slugKey || 
             fName === key || fNameSlug === slugKey;
    });

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
          menu: DEFAULT_MENU_ITEMS,
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

    const mockProfile = mockFirmProfiles[key] || mockFirmProfiles[slugKey];
    if (mockProfile) {
      return mockProfile;
    }

    // Fallback to generic mock data for legacy demo firms
    return {
      id: slug,
      name: slug === 'service-firm' ? 'Service Firm' : 
            slug === 'expert-portfolio' ? 'Expert Portfolio' :
            slug === 'resource-hub' ? 'Knowledge Hub' :
            slug === 'subscription-pro' ? 'Subscription model' :
            (slug === 'abibas' ? 'Abibas' : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
      bio: slug === 'service-firm'
        ? 'A premier service-based organization dedicated to providing high-quality professional services and consulting solutions across multiple industries.'
        : slug === 'expert-portfolio'
        ? 'Specializing in large-scale infrastructure and digital transformation projects with a proven track record of excellence.'
        : slug === 'resource-hub'
        ? 'The leading authority in industry research, technical documentation, and B2B educational resources.'
        : slug === 'subscription-pro'
        ? 'Reliable ongoing support and maintenance through our industry-leading subscription and SLA packages.'
        : (slug === 'global-logistics-corp' 
        ? 'Providing end-to-end logistics solutions for businesses worldwide since 1995. We specialize in AI-driven supply chain optimization.'
        : slug === 'abibas'
        ? 'Leading sports brand specializing in high-performance footwear and apparel. Since 1949, we have been pushing the boundaries of athletic innovation.'
        : 'Leading innovation in our industry with a focus on sustainability and customer excellence.'),
      firmType: (slug === 'service-firm' || slug === 'expert-portfolio' || slug === 'resource-hub' || slug === 'subscription-pro') ? 'SERVICE' : (slug === 'abibas' ? 'PRODUCT' : 'PRODUCT'),
      services: slug === 'service-firm' ? [
        { title: 'Strategic Consulting', description: 'Expert business strategy and growth planning for modern enterprises.' },
        { title: 'Digital Transformation', description: 'Helping businesses modernize their technology stack and workflows.' },
        { title: 'Managed IT Services', description: '24/7 infrastructure support and cybersecurity management.' }
      ] : (slug === 'abibas' ? [
        { title: 'Athletic Footwear', description: 'Engineered for performance, designed for style.' },
        { title: 'Sportswear Apparel', description: 'Breathable and durable clothing for every sport.' },
        { title: 'Global Sponsorship', description: 'Supporting athletes and teams worldwide.' }
      ] : [
        { title: 'Logistics Optimization', description: 'Streamlining supply chains with AI-driven route planning.' },
        { title: 'Global Warehousing', description: 'Strategic storage solutions across 50+ countries.' },
        { title: 'Customs Clearance', description: 'Fast-track international shipping with expert documentation.' }
      ]),
      portfolio: (slug === 'expert-portfolio' || slug === 'global-logistics-corp') ? [
        { 
          title: 'Smart City Infrastructure', 
          description: 'Implementation of IoT-based traffic and energy management for a metropolis.', 
          category: 'Infrastructure',
          result: 'Reduced energy consumption by 30% and traffic congestion by 25%.',
          imageUrl: 'https://images.unsplash.com/photo-1573806935833-fd8650074394?auto=format&fit=crop&q=80&w=800'
        },
        { 
          title: 'Global ERP Migration', 
          description: 'Consolidating 15 legacy systems into a unified cloud platform for a Fortune 500 company.', 
          category: 'Enterprise Software',
          result: 'Streamlined operations across 4 continents with $10M annual savings.',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800'
        }
      ] : (slug === 'abibas' ? [
        {
          title: 'Sustainability Initiative 2025',
          description: 'Revolutionizing footwear production with 100% recycled ocean plastics.',
          category: 'Environment',
          result: 'Zero-waste production achieved in 3 major factories.',
          imageUrl: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=800'
        }
      ] : undefined),
      resources: (slug === 'resource-hub' || slug === 'global-logistics-corp' || slug === 'abibas') ? [
        { 
          title: slug === 'abibas' ? 'Annual Sustainability Report' : '2026 Supply Chain Trends', 
          type: slug === 'abibas' ? 'WHITEPAPER' : 'WHITEPAPER', 
          description: slug === 'abibas' ? 'Detailed analysis of our environmental impact and future goals.' : 'A comprehensive analysis of AI and automation in global logistics.' 
        },
        { 
          title: 'Technical Implementation Guide', 
          type: 'TECHNICAL', 
          description: 'Step-by-step documentation for integrating our API into your ERP.' 
        }
      ] : undefined,
      subscriptions: (slug === 'subscription-pro' || slug === 'global-logistics-corp') ? [
        {
          name: 'Essential Support',
          price: 499,
          interval: 'MONTHLY',
          features: ['9/5 Email Support', 'Standard Security Updates', 'Monthly Health Checks']
        },
        {
          name: 'Enterprise Plus',
          price: 1499,
          interval: 'MONTHLY',
          isPopular: true,
          features: ['24/7 Priority Support', 'Dedicated Account Manager', 'Custom Integration Support', 'Guaranteed 4-hour Response Time']
        }
      ] : undefined,
      team: slug === 'abibas' ? [
        { name: 'Bjørn Gulden', role: 'CEO', avatar: '👤', profileSlug: 'bjorn-gulden' },
        { name: 'Harm Ohlmeyer', role: 'CFO', avatar: '👤', profileSlug: 'harm-ohlmeyer' },
        { name: 'Michelle Robertson', role: 'CHRO', avatar: '👤', profileSlug: 'michelle-robertson' },
        { name: 'Arthur Hoeld', role: 'Executive Board', avatar: '👤', profileSlug: 'arthur-hoeld' },
        { name: 'Brian Grevy', role: 'Executive Board', avatar: '👤', profileSlug: 'brian-grevy' }
      ] : [
        { name: 'John Smith', role: 'CEO & Founder', avatar: '👤', profileSlug: 'john-smith' },
        { name: 'Sarah Wilson', role: 'Head of Operations', avatar: '👤', profileSlug: 'sarah-wilson' },
        { name: 'Michael Chen', role: 'Lead Architect', avatar: '👤', profileSlug: 'michael-chen' }
      ],
      jobs: slug === 'abibas' ? [
        { id: 'a1', title: 'Product Designer', location: 'Herzogenaurach', type: 'Full-time' },
        { id: 'a2', title: 'Marketing Manager', location: 'Remote', type: 'Full-time' }
      ] : [
        { id: '1', title: 'Senior Logistics Analyst', location: 'New York (Remote)', type: 'Full-time' },
        { id: '2', title: 'Supply Chain Coordinator', location: 'Chicago, IL', type: 'Full-time' },
        { id: '3', title: 'Warehouse Manager', location: 'New Jersey', type: 'Full-time' }
      ],
      locations: slug === 'abibas' ? [
        { city: 'Herzogenaurach', address: 'Adi-Dassler-Strasse 1, 91074', type: 'HQ' },
        { city: 'Portland', address: '5055 N Greeley Ave, OR 97217', type: 'US HQ' }
      ] : [
        { city: 'New York', address: '123 Business Ave, NY 10001', type: 'Headquarters' },
        { city: 'London', address: '45 Tech Plaza, London EC1A', type: 'European Hub' },
        { city: 'Singapore', address: '88 Marina Bay, Singapore', type: 'Asia-Pacific Hub' }
      ],
      insights: {
        employeeGrowth: slug === 'abibas' ? '+8%' : '+12%',
        avgTenure: slug === 'abibas' ? '5.5 years' : '4.2 years'
      },
      followersCount: slug === 'global-logistics-corp' ? 52400 : slug === 'abibas' ? 1500000 : 1200
    };
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

  async getFirmFollowers(firmId: string): Promise<any[]> {
    const registry = JSON.parse(localStorage.getItem(FIRM_FOLLOWERS_KEY) || '{}');
    const followedBy = registry[firmId] || [];
    
    // Merge with some mock followers for the firm to make it look active
    const mockFollowers = [
      {
        id: 'user-2',
        name: 'Sarah Connor',
        headline: 'Cybersecurity Specialist',
        location: 'Los Angeles, USA',
        type: 'user'
      },
      {
        id: 'user-3',
        name: 'John Doe',
        headline: 'Business Operations Manager',
        location: 'London, UK',
        type: 'user'
      }
    ];

    const allFollowers = [...followedBy];
    mockFollowers.forEach(m => {
      if (!allFollowers.find(f => f.id === m.id)) {
        allFollowers.push(m);
      }
    });

    return allFollowers;
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
