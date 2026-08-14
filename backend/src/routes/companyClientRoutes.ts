import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponseHandler } from '../utils/apiResponse';
import { UserCompanyConnectionService, ConnectionMessageService } from '../services/userCompanyConnectionService';
import { TicketService, TicketStatus } from '../services/ticketService';

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
      return ApiResponseHandler.success(res, updated, 'Ticket updated', 200);
    } catch {
      return ApiResponseHandler.error(res, 'Ticket not found', undefined, 404);
    }
  })
);

export default router;
