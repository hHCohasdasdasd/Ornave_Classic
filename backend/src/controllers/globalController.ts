import { Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserCompanyConnectionService, FirmInvoiceService } from '../services/userCompanyConnectionService';
import { GlobalRequestService } from '../services/globalRequestService';
import { UserDocumentService } from '../services/userDocumentService';
import { GlobalPaymentService } from '../services/globalPaymentService';
import { FileService } from '../services/workSuiteService';
import { FILES_BUCKET, requireSupabaseAdmin } from '../utils/supabaseStorage';

const FirmInvoiceSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  issuedDate: z.string().min(1),
});

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
    const connection = await UserCompanyConnectionService.ensureConnection(req.user.userId, validated.companyId);

    return ApiResponseHandler.success(res, connection, 'Connection requested', 201);
  });

  static revokeConnection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    await UserCompanyConnectionService.revoke(req.user.userId, req.params.companyId);
    return ApiResponseHandler.success(res, {}, 'Connection removed', 200);
  });

  static getConnectionInvoices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const connection = await UserCompanyConnectionService.getOwned(req.user.userId, req.params.connectionId);
    const invoices = await FirmInvoiceService.list(connection.id);
    return ApiResponseHandler.success(res, invoices, 'Invoices retrieved', 200);
  });

  static createConnectionInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const connection = await UserCompanyConnectionService.getOwned(req.user.userId, req.params.connectionId);
    const validated = FirmInvoiceSchema.parse(req.body);
    const invoice = await FirmInvoiceService.create(connection.id, {
      title: validated.title,
      amount: validated.amount,
      currency: validated.currency,
      issuedDate: new Date(validated.issuedDate),
    });
    return ApiResponseHandler.success(res, invoice, 'Invoice logged', 201);
  });

  static deleteConnectionInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const connection = await UserCompanyConnectionService.getOwned(req.user.userId, req.params.connectionId);
    await FirmInvoiceService.remove(connection.id, req.params.invoiceId);
    return ApiResponseHandler.success(res, {}, 'Invoice deleted', 200);
  });

  static getConnectionFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const connection = await UserCompanyConnectionService.getOwned(req.user.userId, req.params.connectionId);
    const files = await FileService.listByConnection(req.user.userId, connection.id);
    return ApiResponseHandler.success(res, files, 'Files retrieved', 200);
  });

  static uploadConnectionFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }
    const file = (req as any).file;
    if (!file) return ApiResponseHandler.error(res, 'No file provided', undefined, 400);

    const connection = await UserCompanyConnectionService.getOwned(req.user.userId, req.params.connectionId);
    const supabase = requireSupabaseAdmin();
    const safeName = file.originalname.replace(/[^\w.\-() ]/g, '_');
    const storageKey = `${req.user.userId}/${uuidv4()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(storageKey, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      return ApiResponseHandler.error(res, 'Failed to upload file', uploadError.message, 502);
    }

    const created = await FileService.create({
      userId: req.user.userId,
      connectionId: connection.id,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      storageKey,
    });
    return ApiResponseHandler.success(res, created, 'File uploaded successfully', 201);
  });

  static downloadConnectionFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const file = await FileService.getById(req.user.userId, req.params.fileId);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(file.storageKey, 60, { download: file.name });
    if (error || !data) {
      return ApiResponseHandler.error(res, 'Failed to generate download link', error?.message, 502);
    }
    return ApiResponseHandler.success(res, { url: data.signedUrl }, 'Download link generated', 200);
  });

  static deleteConnectionFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ApiResponseHandler.error(res, 'Unauthorized', undefined, 401);
    }

    const file = await FileService.remove(req.user.userId, req.params.fileId);
    const supabase = requireSupabaseAdmin();
    await supabase.storage.from(FILES_BUCKET).remove([file.storageKey]);
    return ApiResponseHandler.success(res, {}, 'File deleted successfully', 200);
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
