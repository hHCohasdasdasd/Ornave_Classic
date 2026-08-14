import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { StoreService, OrderDocumentService, OrderMessageService } from '../services/storeService';
import { NotificationService } from '../services/notificationService';
import { ApiResponseHandler } from '../utils/apiResponse';
import { FILES_BUCKET, requireSupabaseAdmin } from '../utils/supabaseStorage';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});

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
    const { name, description, detailedDescription, price, currency, imageUrl, media, category, stock } = req.body;

    if (!req.user.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can create products', undefined, 403);
    }

    const product = await StoreService.createProduct({
      companyId: req.user.companyId,
      name,
      description,
      detailedDescription,
      price,
      currency,
      imageUrl,
      media: Array.isArray(media) ? media : undefined,
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
    const { companyId, items, billingAddress, deliveryAddress, payment } = req.body;

    const order = await StoreService.createOrder({
      userId: req.user.userId,
      companyId,
      items,
      billingAddress,
      deliveryAddress,
      payment,
    });

    return ApiResponseHandler.success(res, order, 'Order created successfully', 201);
  })
);

// Get user orders
storeRoutes.get(
  '/my-orders',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const orders = await StoreService.getUserOrders(req.user.userId);
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

// Get this user's orders with one specific company (a firm connection's order history)
storeRoutes.get(
  '/orders/with-company/:companyId',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const orders = await StoreService.getUserOrdersWithCompany(req.user.userId, req.params.companyId);
    return ApiResponseHandler.success(res, orders, 'Orders retrieved successfully');
  })
);

// Get a single order — the buyer or the selling company only
storeRoutes.get(
  '/orders/:orderId',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const order = await StoreService.getOrderById(req.params.orderId);
    if (!order || (order.userId !== req.user.userId && order.companyId !== req.user.companyId)) {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
    return ApiResponseHandler.success(res, order, 'Order retrieved successfully');
  })
);

// Update an order's status/tracking — the selling company only
storeRoutes.patch(
  '/orders/:orderId/status',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    if (!req.user.companyId) {
      return ApiResponseHandler.error(res, 'Only the selling company can update an order', undefined, 403);
    }
    const { status, trackingNumber } = req.body;
    try {
      const order = await StoreService.updateOrderStatus(req.user.companyId, req.params.orderId, { status, trackingNumber });
      return ApiResponseHandler.success(res, order, 'Order updated successfully');
    } catch {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
  })
);

/**
 * ORDER DOCUMENTS — either the buyer or the selling company can attach one;
 * each side can only delete what it uploaded.
 */

storeRoutes.get(
  '/orders/:orderId/documents',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const order = await StoreService.getOrderById(req.params.orderId);
    if (!order || (order.userId !== req.user.userId && order.companyId !== req.user.companyId)) {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
    const documents = await OrderDocumentService.list(order.id);
    return ApiResponseHandler.success(res, documents, 'Documents retrieved successfully');
  })
);

storeRoutes.post(
  '/orders/:orderId/documents',
  authMiddleware,
  upload.single('file'),
  asyncHandler(async (req: any, res: Response) => {
    const order = await StoreService.getOrderById(req.params.orderId);
    const isCompanySide = !!order && order.companyId === req.user.companyId;
    const isBuyerSide = !!order && order.userId === req.user.userId;
    if (!order || (!isCompanySide && !isBuyerSide)) {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
    if (!req.file) return ApiResponseHandler.error(res, 'No file provided', undefined, 400);

    const supabase = requireSupabaseAdmin();
    const safeName = req.file.originalname.replace(/[^\w.\-() ]/g, '_');
    const storageKey = `${order.userId}/orders/${order.id}/${uuidv4()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(storageKey, req.file.buffer, { contentType: req.file.mimetype });
    if (uploadError) {
      return ApiResponseHandler.error(res, 'Failed to upload file', uploadError.message, 502);
    }

    const document = await OrderDocumentService.create(order.id, {
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      storageKey,
      uploadedByCompany: isCompanySide,
    });
    return ApiResponseHandler.success(res, document, 'Document uploaded successfully', 201);
  })
);

storeRoutes.get(
  '/orders/:orderId/documents/:docId/download',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const order = await StoreService.getOrderById(req.params.orderId);
    if (!order || (order.userId !== req.user.userId && order.companyId !== req.user.companyId)) {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
    const doc = await OrderDocumentService.getById(order.id, req.params.docId);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(doc.storageKey, 60, { download: doc.name });
    if (error || !data) {
      return ApiResponseHandler.error(res, 'Failed to generate download link', error?.message, 502);
    }
    return ApiResponseHandler.success(res, { url: data.signedUrl }, 'Download link generated');
  })
);

storeRoutes.delete(
  '/orders/:orderId/documents/:docId',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const order = await StoreService.getOrderById(req.params.orderId);
    if (!order || (order.userId !== req.user.userId && order.companyId !== req.user.companyId)) {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
    const doc = await OrderDocumentService.getById(order.id, req.params.docId);
    const isCompanySide = order.companyId === req.user.companyId;
    if (doc.uploadedByCompany !== isCompanySide) {
      return ApiResponseHandler.error(res, 'You can only remove documents you uploaded', undefined, 403);
    }
    await OrderDocumentService.remove(order.id, doc.id);
    const supabase = requireSupabaseAdmin();
    await supabase.storage.from(FILES_BUCKET).remove([doc.storageKey]);
    return ApiResponseHandler.success(res, {}, 'Document deleted successfully');
  })
);

/**
 * ORDER MESSAGES — the buyer and selling company writing directly to each
 * other about this specific order.
 */

storeRoutes.get(
  '/orders/:orderId/messages',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const order = await StoreService.getOrderById(req.params.orderId);
    if (!order || (order.userId !== req.user.userId && order.companyId !== req.user.companyId)) {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
    const messages = await OrderMessageService.list(order.id);
    return ApiResponseHandler.success(res, messages, 'Messages retrieved successfully');
  })
);

storeRoutes.post(
  '/orders/:orderId/messages',
  authMiddleware,
  asyncHandler(async (req: any, res: Response) => {
    const order = await StoreService.getOrderById(req.params.orderId);
    const isCompanySide = !!order && order.companyId === req.user.companyId;
    const isBuyerSide = !!order && order.userId === req.user.userId;
    if (!order || (!isCompanySide && !isBuyerSide)) {
      return ApiResponseHandler.error(res, 'Order not found', undefined, 404);
    }
    const content = (req.body.content || '').trim();
    if (!content) return ApiResponseHandler.error(res, 'Message content is required', undefined, 400);
    const message = await OrderMessageService.create(order.id, isCompanySide, content);
    if (isCompanySide) {
      await NotificationService.create(order.userId, {
        type: 'order_message',
        title: `New message from ${order.company?.name || 'the seller'} about your order`,
        body: content.slice(0, 140),
        actionRoute: '/purchased-services',
      });
    }
    return ApiResponseHandler.success(res, message, 'Message sent successfully', 201);
  })
);

export default storeRoutes;
