import { apiClient } from './api';

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  company?: { name: string; id: string };
}

export interface Order {
  id: string;
  userId: string;
  companyId: string;
  status: string;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  company?: { name: string };
  user?: { firstName: string; lastName: string };
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

const ORDERS_KEY = 'ornave_orders';

class StoreService {
  private getStoredOrders(): Order[] {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (!stored) {
      // Seed initial data
      const initial: Order[] = [
        {
          id: 'ord-1',
          userId: 'demo-user',
          companyId: 'abibas',
          status: 'COMPLETED',
          totalAmount: 180,
          currency: 'USD',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          company: { name: 'Abibas Official', id: 'abibas' },
          items: [
            { id: 'i1', productId: 'p2', product: { name: 'Ultraboost 22', price: 180 } as any, quantity: 1, price: 180 }
          ]
        },
        {
          id: 'ord-2',
          userId: 'demo-user',
          companyId: 'global-logistics-corp',
          status: 'ACTIVE',
          totalAmount: 1200,
          currency: 'USD',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          company: { name: 'Global Logistics Corp', id: 'global-logistics-corp' },
          items: [
            { id: 'i2', productId: 's1', product: { name: 'Enterprise SaaS License', price: 1200 } as any, quantity: 1, price: 1200 }
          ]
        }
      ];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get('/store/products');
      return response.data.data || response.data;
    } catch (error) {
      console.warn('API error, using local products');
      return [];
    }
  }

  async getUserOrders(): Promise<Order[]> {
    return this.getStoredOrders();
  }

  async getFirmStats(firmId: string) {
    const orders = this.getStoredOrders().filter(o => o.companyId === firmId);
    return {
      activeServices: orders.filter(o => o.status === 'ACTIVE').length,
      historyCount: orders.length,
      lastInteraction: orders[0]?.createdAt || 'N/A'
    };
  }

  async getCompanyProducts(companyId: string): Promise<Product[]> {
    if (companyId === 'abibas') {
      return [
        {
          id: 'p1',
          companyId: 'abibas',
          name: 'Superstar Shoes',
          description: 'The iconic shell-toe shoes that started on the court and moved to the streets.',
          price: 90.00,
          currency: 'USD',
          imageUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&q=80&w=400',
          category: 'Footwear',
          stock: 50,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'p2',
          companyId: 'abibas',
          name: 'Ultraboost 22',
          description: 'Maximum energy return and comfort with our signature Boost midsole.',
          price: 180.00,
          currency: 'USD',
          imageUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&q=80&w=400',
          category: 'Footwear',
          stock: 30,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'p3',
          companyId: 'abibas',
          name: 'Tiro Track Suit',
          description: 'Classic athletic style with moisture-absorbing fabric for all-day comfort.',
          price: 75.00,
          currency: 'USD',
          imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400',
          category: 'Apparel',
          stock: 100,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'p4',
          companyId: 'abibas',
          name: 'Stan Smith Classic',
          description: 'Timeless design with a clean, minimalist look. A staple in any wardrobe.',
          price: 85.00,
          currency: 'USD',
          imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400',
          category: 'Footwear',
          stock: 45,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'p5',
          companyId: 'abibas',
          name: 'Powerlift 4',
          description: 'The stability you need for heavy lifting. Locked-in fit for peak performance.',
          price: 100.00,
          currency: 'USD',
          imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=400',
          category: 'Footwear',
          stock: 20,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'p6',
          companyId: 'abibas',
          name: 'Classic Backpack',
          description: 'Durable and spacious. Carry your gear in style with the iconic three stripes.',
          price: 45.00,
          currency: 'USD',
          imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
          category: 'Accessories',
          stock: 150,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
    try {
      const response = await apiClient.get(`/store/companies/${companyId}/products`);
      const data = response.data.data ?? response.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await apiClient.post('/store/products', data);
    return response.data.data || response.data;
  }

  async createOrder(companyId: string, items: { productId: string; quantity: number }[]): Promise<Order> {
    const response = await apiClient.post('/store/orders', { companyId, items });
    return response.data.data || response.data;
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await apiClient.get('/store/my-orders');
    return response.data.data || response.data;
  }

  async getCompanyOrders(): Promise<Order[]> {
    const response = await apiClient.get('/store/company-orders');
    return response.data.data || response.data;
  }
}

export const storeService = new StoreService();
