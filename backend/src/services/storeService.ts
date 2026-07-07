import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProductRequest {
  companyId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  category?: string;
  stock?: number;
}

export interface ProductResponse {
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
  createdAt: Date;
}

export interface CreateOrderRequest {
  userId: string;
  companyId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export class StoreService {
  /**
   * Create a new product for a company
   */
  static async createProduct(request: CreateProductRequest): Promise<ProductResponse> {
    return await prisma.product.create({
      data: {
        companyId: request.companyId,
        name: request.name,
        description: request.description,
        price: request.price,
        currency: request.currency || 'USD',
        imageUrl: request.imageUrl,
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
    });
  }

  /**
   * Update a product
   */
  static async updateProduct(productId: string, data: Partial<CreateProductRequest>): Promise<ProductResponse> {
    return await prisma.product.update({
      where: { id: productId },
      data,
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
}
