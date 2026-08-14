import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { UserCompanyConnectionService, ConnectionMessageService } from '../services/userCompanyConnectionService';
import { TicketService, TicketStatus } from '../services/ticketService';
import { NotificationService } from '../services/notificationService';
import { FileService } from '../services/workSuiteService';
import { FILES_BUCKET, requireSupabaseAdmin } from '../utils/supabaseStorage';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware);

// The buyers connected to this company — the company's client list.
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can view clients', undefined, 403);
    }
    const connections = await UserCompanyConnectionService.listForCompany(req.user.companyId);
    return ApiResponseHandler.success(res, connections, 'Clients retrieved', 200);
  })
);

router.get(
  '/:connectionId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can view messages', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const messages = await ConnectionMessageService.list(connection.id);
    return ApiResponseHandler.success(res, messages, 'Messages retrieved', 200);
  })
);

router.post(
  '/:connectionId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can send messages', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const content = (req.body.content || '').trim();
    if (!content) return ApiResponseHandler.error(res, 'Message content is required', undefined, 400);
    const message = await ConnectionMessageService.create(connection.id, true, content);
    await NotificationService.create(connection.userId, {
      type: 'connection_message',
      title: `New message from ${connection.company.name}`,
      body: content.slice(0, 140),
      actionRoute: `/work-suite/connections/firms/${connection.companyId}`,
    });
    return ApiResponseHandler.success(res, message, 'Message sent', 201);
  })
);

router.get(
  '/:connectionId/tickets',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can view tickets', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const tickets = await TicketService.list(connection.id);
    return ApiResponseHandler.success(res, tickets, 'Tickets retrieved', 200);
  })
);

router.get(
  '/tickets/:ticketId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can view tickets', undefined, 403);
    }
    try {
      const ticket = await TicketService.getOwnedByCompany(req.user.companyId, req.params.ticketId);
      const messages = await TicketService.listMessages(ticket.id);
      return ApiResponseHandler.success(res, { ...ticket, messages }, 'Ticket retrieved', 200);
    } catch {
      return ApiResponseHandler.error(res, 'Ticket not found', undefined, 404);
    }
  })
);

router.post(
  '/tickets/:ticketId/messages',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can reply to tickets', undefined, 403);
    }
    try {
      const ticket = await TicketService.getOwnedByCompany(req.user.companyId, req.params.ticketId);
      const content = (req.body.content || '').trim();
      if (!content) return ApiResponseHandler.error(res, 'Message content is required', undefined, 400);
      const message = await TicketService.addMessage(ticket.id, true, content);
      await NotificationService.create(ticket.connection.userId, {
        type: 'ticket_message',
        title: `Reply on "${ticket.subject}"`,
        body: content.slice(0, 140),
        actionRoute: `/work-suite/connections/firms/${ticket.connection.companyId}`,
      });
      return ApiResponseHandler.success(res, message, 'Message sent', 201);
    } catch {
      return ApiResponseHandler.error(res, 'Ticket not found', undefined, 404);
    }
  })
);

router.patch(
  '/tickets/:ticketId/status',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can update ticket status', undefined, 403);
    }
    const status = req.body.status;
    if (!Object.keys(TicketStatus).includes(status)) {
      return ApiResponseHandler.error(res, 'Invalid status', undefined, 400);
    }
    try {
      const ticket = await TicketService.getOwnedByCompany(req.user.companyId, req.params.ticketId);
      const updated = await TicketService.updateStatus(ticket.id, status);
      await NotificationService.create(ticket.connection.userId, {
        type: 'ticket_status',
        title: `"${ticket.subject}" is now ${status.replace('_', ' ').toLowerCase()}`,
        actionRoute: `/work-suite/connections/firms/${ticket.connection.companyId}`,
      });
      return ApiResponseHandler.success(res, updated, 'Ticket updated', 200);
    } catch {
      return ApiResponseHandler.error(res, 'Ticket not found', undefined, 404);
    }
  })
);

// ── Connection files — same bucket the buyer side already uploads to
// (/global/connections/:connectionId/files); the company side of this was
// previously unreachable — a buyer could upload but the company had no
// route or UI to ever see it. ──

router.get(
  '/:connectionId/files',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can view files', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const files = await FileService.listByConnectionAnySide(connection.id);
    return ApiResponseHandler.success(res, files, 'Files retrieved', 200);
  })
);

router.post(
  '/:connectionId/files',
  upload.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can upload files', undefined, 403);
    }
    const file = (req as any).file;
    if (!file) return ApiResponseHandler.error(res, 'No file provided', undefined, 400);

    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const supabase = requireSupabaseAdmin();
    const safeName = file.originalname.replace(/[^\w.\-() ]/g, '_');
    const storageKey = `${connection.userId}/${uuidv4()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(storageKey, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      return ApiResponseHandler.error(res, 'Failed to upload file', uploadError.message, 502);
    }

    const created = await FileService.create({
      userId: connection.userId,
      connectionId: connection.id,
      uploadedByCompany: true,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      storageKey,
    });
    await NotificationService.create(connection.userId, {
      type: 'connection_file',
      title: `${connection.company.name} added a file`,
      body: file.originalname,
      actionRoute: `/work-suite/connections/firms/${connection.companyId}`,
    });
    return ApiResponseHandler.success(res, created, 'File uploaded successfully', 201);
  })
);

router.get(
  '/:connectionId/files/:fileId/download',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can download files', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const file = await FileService.getByIdInConnection(connection.id, req.params.fileId);
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(file.storageKey, 60, { download: file.name });
    if (error || !data) {
      return ApiResponseHandler.error(res, 'Failed to generate download link', error?.message, 502);
    }
    return ApiResponseHandler.success(res, { url: data.signedUrl }, 'Download link generated', 200);
  })
);

router.delete(
  '/:connectionId/files/:fileId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.companyId) {
      return ApiResponseHandler.error(res, 'Only company users can delete files', undefined, 403);
    }
    const connection = await UserCompanyConnectionService.getOwnedByCompany(req.user.companyId, req.params.connectionId);
    const file = await FileService.getByIdInConnection(connection.id, req.params.fileId);
    if (!file.uploadedByCompany) {
      return ApiResponseHandler.error(res, 'You can only remove files you uploaded', undefined, 403);
    }
    await FileService.removeInConnection(connection.id, file.id);
    const supabase = requireSupabaseAdmin();
    await supabase.storage.from(FILES_BUCKET).remove([file.storageKey]);
    return ApiResponseHandler.success(res, {}, 'File deleted successfully', 200);
  })
);

export default router;
