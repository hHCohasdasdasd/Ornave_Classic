import { Router } from 'express';
import { GlobalController } from '../controllers/globalController';
import { authMiddleware, userTypeMiddleware } from '../middleware/auth';
import { createFileUpload } from '../utils/uploadConfig';

const upload = createFileUpload();

const router = Router();

router.use(authMiddleware, userTypeMiddleware('USER'));

// Dashboard
router.get('/dashboard', GlobalController.getDashboard);

// User-company connections
router.get('/connections', GlobalController.getConnections);
router.post('/connections', GlobalController.requestConnection);
router.delete('/connections/:companyId', GlobalController.revokeConnection);

// Per-connection files
router.get('/connections/:connectionId/files', GlobalController.getConnectionFiles);
router.post('/connections/:connectionId/files', upload.single('file'), GlobalController.uploadConnectionFile);
router.get('/connections/:connectionId/files/:fileId/download', GlobalController.downloadConnectionFile);
router.delete('/connections/:connectionId/files/:fileId', GlobalController.deleteConnectionFile);

// Per-connection direct messages (buyer ↔ firm, independent of any order)
router.get('/connections/:connectionId/messages', GlobalController.getConnectionMessages);
router.post('/connections/:connectionId/messages', GlobalController.sendConnectionMessage);

// Support tickets — always opened by the buyer, tracked to resolution
router.get('/connections/:connectionId/tickets', GlobalController.getConnectionTickets);
router.post('/connections/:connectionId/tickets', GlobalController.openConnectionTicket);
router.get('/tickets/:ticketId', GlobalController.getTicket);
router.post('/tickets/:ticketId/messages', GlobalController.sendTicketMessage);
router.post('/tickets/:ticketId/close', GlobalController.closeTicket);

// Structured requests
router.get('/requests', GlobalController.getRequests);
router.post('/requests', GlobalController.createRequest);
router.get('/requests/:id', GlobalController.getRequestById);
router.patch('/requests/:id/status', GlobalController.updateRequestStatus);

// Document vault
router.get('/documents', GlobalController.getDocuments);
router.post('/documents', GlobalController.uploadDocument);

// Payments
router.get('/payments', GlobalController.getPayments);
router.post('/payments', GlobalController.createPayment);

// Activity timeline
router.get('/activity', GlobalController.getActivity);

export default router;
