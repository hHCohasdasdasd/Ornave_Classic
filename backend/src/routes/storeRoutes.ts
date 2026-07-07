import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { StoreService } from '../services/storeService';
import { ApiResponseHandler } from '../utils/apiResponse';

export const storeRoutes = Router();

/**
 * PRODUCTS
 */

// Get all products for the global store
storeRoutes.get(
  '/products',
  asyncHandler(async (_req: Request, res: Response) => {
    const products = await StoreService.getAllProducts();
    return ApiResponseHandler.success(res, products, 'Products retrieved successfully');
  })
);

// Get all products for a company
storeRoutes.get(
  '/companies/:companyId/products',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const products = await StoreService.getCompanyProducts(companyId);
    return ApiResponseHandler.success(res, products, 'Products retrieved successfully');
  })
);

// Get a single product
storeRoutes.get(
  '/products/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const product = await StoreService.getProduct(productId);
    if (!product) return ApiResponseHandler.error(res, 'Product not found', undefined, 404);
    return ApiResponseHandler.success(res, product, 'Product retrieved successfully');
  })
);

// Create a product (Company Owner/Admin only)
storeRoutes.post(
  '/products',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const { name, description, price, currency, imageUrl, category, stock } = req.body;
    
    if (!req.user.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can create products', undefined, 403);
    }

    const product = await StoreService.createProduct({
      companyId: req.user.companyId,
      name,
      description,
      price,
      currency,
      imageUrl,
      category,
      stock,
    });

    return ApiResponseHandler.success(res, product, 'Product created successfully', 201);
  })
);

/**
 * ORDERS
 */

// Create an order
storeRoutes.post(
  '/orders',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const { companyId, items } = req.body;

    const order = await StoreService.createOrder({
      userId: req.user.id,
      companyId,
      items,
    });

    return ApiResponseHandler.success(res, order, 'Order created successfully', 201);
  })
);

// Get user orders
storeRoutes.get(
  '/my-orders',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const orders = await StoreService.getUserOrders(req.user.id);
    return ApiResponseHandler.success(res, orders, 'Orders retrieved successfully');
  })
);

// Get company orders
storeRoutes.get(
  '/company-orders',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) {
      return ApiResponseHandler.error(res, 'Not associated with a company', undefined, 403);
    }
    const orders = await StoreService.getCompanyOrders(req.user.companyId);
    return ApiResponseHandler.success(res, orders, 'Company orders retrieved successfully');
  })
);

export default storeRoutes;
