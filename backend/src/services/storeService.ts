import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface CreateProductRequest {
  companyId: string;
  name: string;
  description?: string;
  detailedDescription?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  media?: ProductMediaItem[];
  category?: string;
  stock?: number;
}

export interface ProductResponse {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  detailedDescription: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  media: string;
  category: string | null;
  stock: number;
  isActive: boolean;
  createdAt: Date;
}

export interface OrderAddress {
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateOrderRequest {
  userId: string;
  companyId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  billingAddress?: OrderAddress;
  deliveryAddress?: OrderAddress;
  payment?: { brand?: string; last4?: string };
}

export class StoreService {
  /**
   * Create a new product for a company
   */
  static async createProduct(request: CreateProductRequest): Promise<ProductResponse> {
    const media = request.media && request.media.length > 0
      ? request.media
      : (request.imageUrl ? [{ type: 'image' as const, url: request.imageUrl }] : []);

    return await prisma.product.create({
      data: {
        companyId: request.companyId,
        name: request.name,
        description: request.description,
        detailedDescription: request.detailedDescription,
        price: request.price,
        currency: request.currency || 'USD',
        imageUrl: request.imageUrl || media[0]?.url,
        media: JSON.stringify(media),
        category: request.category,
        stock: request.stock || 0,
        isActive: true,
      },
    });
  }

  /**
   * Get all active products from all companies
   */
  static async getAllProducts(): Promise<ProductResponse[]> {
    return await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all products for a company
   */
  static async getCompanyProducts(companyId: string): Promise<ProductResponse[]> {
    return await prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single product
   */
  static async getProduct(productId: string): Promise<ProductResponse | null> {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: { company: true },
    });
  }

  /**
   * Update a product
   */
  static async updateProduct(productId: string, data: Partial<CreateProductRequest>): Promise<ProductResponse> {
    const { media, ...rest } = data;
    return await prisma.product.update({
      where: { id: productId },
      data: {
        ...rest,
        ...(media ? { media: JSON.stringify(media) } : {}),
      },
    });
  }

  /**
   * Delete a product (deactivate)
   */
  static async deleteProduct(productId: string): Promise<ProductResponse> {
    return await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  /**
   * Create a new order
   */
  static async createOrder(request: CreateOrderRequest) {
    // 1. Get all products to calculate total and verify price
    const productIds = request.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));
    
    let totalAmount = 0;
    const orderItemsData = request.items.map(item => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      
      const price = product.price;
      totalAmount += price * item.quantity;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: price,
      };
    });

    // 2. Create order and items in a transaction
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: request.userId,
          companyId: request.companyId,
          totalAmount,
          currency: products[0]?.currency || 'USD',
          status: 'PENDING',
          billingAddress: request.billingAddress?.address,
          billingCity: request.billingAddress?.city,
          billingState: request.billingAddress?.state,
          billingPostalCode: request.billingAddress?.postalCode,
          billingCountry: request.billingAddress?.country,
          deliveryAddress: request.deliveryAddress?.address,
          deliveryCity: request.deliveryAddress?.city,
          deliveryState: request.deliveryAddress?.state,
          deliveryPostalCode: request.deliveryAddress?.postalCode,
          deliveryCountry: request.deliveryAddress?.country,
          paymentBrand: request.payment?.brand,
          paymentLast4: request.payment?.last4,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 3. Update stock
      for (const item of request.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });
  }

  /**
   * Get user orders
   */
  static async getUserOrders(userId: string) {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get company orders
   */
  static async getCompanyOrders(companyId: string) {
    return await prisma.order.findMany({
      where: { companyId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * One user's order history with one specific company — what a firm
   * connection's detail view shows.
   */
  static async getUserOrdersWithCompany(userId: string, companyId: string) {
    return await prisma.order.findMany({
      where: { userId, companyId },
      include: {
        items: { include: { product: true } },
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOrderById(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        company: true,
        user: true,
      },
    });
  }

  /**
   * Update an order's status/tracking — the selling company only, scoped so
   * one company can never touch another's order.
   */
  static async updateOrderStatus(companyId: string, orderId: string, data: { status?: string; trackingNumber?: string }) {
    const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
    if (!order) throw new Error('Order not found');
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.trackingNumber !== undefined ? { trackingNumber: data.trackingNumber } : {}),
      },
      // Callers (the order detail modal) replace their whole Order object
      // with this response, so it needs the same shape as getOrderById —
      // items in particular, or rendering the item list crashes.
      include: {
        items: { include: { product: true } },
        company: true,
        user: true,
      },
    });
  }
}

export class OrderDocumentService {
  static async list(orderId: string) {
    return prisma.orderDocument.findMany({ where: { orderId }, orderBy: { createdAt: 'desc' } });
  }

  static async create(orderId: string, data: { name: string; size: number; mimeType: string; storageKey: string }) {
    return prisma.orderDocument.create({ data: { orderId, ...data } });
  }

  static async getById(orderId: string, id: string) {
    const doc = await prisma.orderDocument.findFirst({ where: { id, orderId } });
    if (!doc) throw new Error('Document not found');
    return doc;
  }

  static async remove(orderId: string, id: string) {
    const doc = await this.getById(orderId, id);
    await prisma.orderDocument.delete({ where: { id } });
    return doc;
  }
}
