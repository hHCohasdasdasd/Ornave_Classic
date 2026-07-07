import { Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserCompanyConnectionService } from '../services/userCompanyConnectionService';
import { GlobalRequestService } from '../services/globalRequestService';
import { UserDocumentService } from '../services/userDocumentService';
import { GlobalPaymentService } from '../services/globalPaymentService';

const ConnectionRequestSchema = z.object({
  companyId: z.string().min(1),
  relationshipType: z.enum(['TENANT', 'CLIENT', 'SUBSCRIBER', 'OTHER']).optional(),
  permissions: z.record(z.any()).optional(),
});

const GlobalRequestSchema = z.object({
  companyId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  attachedFiles: z.array(z.string()).optional(),
  preferredDates: z.array(z.string()).optional(),
});

const DocumentSchema = z.object({
  companyId: z.string().min(1),
  fileUrl: z.string().min(1),
  type: z.string().min(1),
  visibility: z.string().optional(),
  uploadedBy: z.string().optional(),
});

const PaymentSchema = z.object({
  companyId: z.string().min(1),
  erpInvoiceId: z.string().optional(),
  amount: z.number().positive(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.string().min(1),
  reason: z.string().optional(),
});

export class GlobalController {
  static getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const [connections, openRequests, activity] = await Promise.all([
      UserCompanyConnectionService.getUserConnections(req.user.userId),
      GlobalRequestService.getRequests(req.user.userId),
      GlobalRequestService.getActivity(req.user.userId),
    ]);

    const pendingActions = openRequests.filter((request: { status: string }) => request.status !== 'CLOSED');

    return ApiResponseHandler.success(
      res,
      {
        connections,
        openRequests,
        pendingActions,
        recentActivity: activity,
      },
      'Dashboard retrieved',
      200
    );
  });

  static getConnections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const connections = await UserCompanyConnectionService.getUserConnections(req.user.userId);
    return ApiResponseHandler.success(res, connections, 'Connections retrieved', 200);
  });

  static requestConnection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const validated = ConnectionRequestSchema.parse(req.body);
    const connection = await UserCompanyConnectionService.requestConnection(req.user.userId, validated as any);

    return ApiResponseHandler.success(res, connection, 'Connection requested', 201);
  });

  static getRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const requests = await GlobalRequestService.getRequests(req.user.userId);
    return ApiResponseHandler.success(res, requests, 'Requests retrieved', 200);
  });

  static getRequestById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const request = await GlobalRequestService.getRequestById(req.user.userId, req.params.id);
    return ApiResponseHandler.success(res, request, 'Request retrieved', 200);
  });

  static createRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const validated = GlobalRequestSchema.parse(req.body);
    const request = await GlobalRequestService.createRequest(req.user.userId, validated as any);
    return ApiResponseHandler.success(res, request, 'Request created', 201);
  });

  static updateRequestStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = UpdateStatusSchema.parse(req.body);
    const request = await GlobalRequestService.updateStatus(req.params.id, validated.status, validated.reason);
    return ApiResponseHandler.success(res, request, 'Status updated', 200);
  });

  static getDocuments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const docs = await UserDocumentService.getDocuments(req.user.userId);
    return ApiResponseHandler.success(res, docs, 'Documents retrieved', 200);
  });

  static uploadDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const validated = DocumentSchema.parse(req.body);
    const doc = await UserDocumentService.uploadDocument(req.user.userId, validated as any);
    return ApiResponseHandler.success(res, doc, 'Document uploaded', 201);
  });

  static getPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const payments = await GlobalPaymentService.getPayments(req.user.userId);
    return ApiResponseHandler.success(res, payments, 'Payments retrieved', 200);
  });

  static createPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const validated = PaymentSchema.parse(req.body);
    const payment = await GlobalPaymentService.createPayment(req.user.userId, validated as any);
    return ApiResponseHandler.success(res, payment, 'Payment created', 201);
  });

  static getActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const activity = await GlobalRequestService.getActivity(req.user.userId);
    return ApiResponseHandler.success(res, activity, 'Activity retrieved', 200);
  });
}
