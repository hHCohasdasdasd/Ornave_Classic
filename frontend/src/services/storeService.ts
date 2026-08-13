import { apiClient } from './api';

export interface ProductMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  detailedDescription?: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  media?: string;
  category: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  company?: { name: string; id: string };
}

/** A product's media as a clean list, falling back to its single legacy
 * `imageUrl` for older records created before multi-media support. */
export function getProductMedia(product: Product): ProductMediaItem[] {
  if (product.media) {
    try {
      const parsed = JSON.parse(product.media);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to legacy imageUrl
    }
  }
  return product.imageUrl ? [{ type: 'image', url: product.imageUrl }] : [];
}

export interface OrderAddress {
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  id: string;
  userId: string;
  companyId: string;
  status: string;
  trackingNumber?: string | null;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  company?: { name: string };
  user?: { firstName: string; lastName: string };
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryPostalCode?: string | null;
  deliveryCountry?: string | null;
  paymentBrand?: string | null;
  paymentLast4?: string | null;
  createdAt: string;
}

export interface OrderDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedByCompany: boolean;
  createdAt: string;
}

export interface OrderMessage {
  id: string;
  senderIsCompany: boolean;
  content: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

class StoreService {
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get('/store/products');
      return response.data.data || response.data;
    } catch (error) {
      console.warn('API error, using local products');
      return [];
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    try {
      const response = await apiClient.get(`/store/products/${productId}`);
      return response.data.data || response.data;
    } catch {
      return null;
    }
  }

  async getUserOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get('/store/my-orders');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  async getFirmStats(firmId: string) {
    const orders = (await this.getUserOrders()).filter(o => o.companyId === firmId);
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

  async createProduct(data: Partial<Omit<Product, 'media'>> & { media?: ProductMediaItem[] }): Promise<Product> {
    const response = await apiClient.post('/store/products', data);
    return response.data.data || response.data;
  }

  async createOrder(
    companyId: string,
    items: { productId: string; quantity: number }[],
    extra?: { billingAddress?: OrderAddress; deliveryAddress?: OrderAddress; payment?: { brand?: string; last4?: string } }
  ): Promise<Order> {
    const response = await apiClient.post('/store/orders', { companyId, items, ...extra });
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

  async getOrdersWithCompany(companyId: string): Promise<Order[]> {
    const response = await apiClient.get(`/store/orders/with-company/${companyId}`);
    return response.data.data || response.data;
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get(`/store/orders/${orderId}`);
    return response.data.data;
  }

  async updateOrderStatus(orderId: string, data: { status?: string; trackingNumber?: string }): Promise<Order> {
    const response = await apiClient.patch(`/store/orders/${orderId}/status`, data);
    return response.data.data;
  }

  async getOrderDocuments(orderId: string): Promise<OrderDocument[]> {
    const response = await apiClient.get(`/store/orders/${orderId}/documents`);
    return response.data.data || [];
  }

  async uploadOrderDocument(orderId: string, file: File, onProgress?: (percent: number) => void): Promise<OrderDocument> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/store/orders/${orderId}/documents`, formData, {
      // The api client's default 'Content-Type: application/json' header
      // makes axios JSON-serialize FormData bodies unless explicitly unset
      // here, letting it fall through to multipart/form-data instead.
      headers: { 'Content-Type': undefined },
      onUploadProgress: onProgress
        ? (e: { loaded: number; total?: number }) => {
            if (e.total) onProgress(Math.round((e.loaded / e.total) * 100));
          }
        : undefined,
    });
    return response.data.data;
  }

  async getOrderDocumentDownloadUrl(orderId: string, docId: string): Promise<string> {
    const response = await apiClient.get(`/store/orders/${orderId}/documents/${docId}/download`);
    return response.data.data.url;
  }

  async deleteOrderDocument(orderId: string, docId: string): Promise<void> {
    await apiClient.delete(`/store/orders/${orderId}/documents/${docId}`);
  }

  async getOrderMessages(orderId: string): Promise<OrderMessage[]> {
    const response = await apiClient.get(`/store/orders/${orderId}/messages`);
    return response.data.data || [];
  }

  async sendOrderMessage(orderId: string, content: string): Promise<OrderMessage> {
    const response = await apiClient.post(`/store/orders/${orderId}/messages`, { content });
    return response.data.data;
  }
}

export const storeService = new StoreService();
