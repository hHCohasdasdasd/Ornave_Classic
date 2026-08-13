import { Router } from 'express';
import multer from 'multer';
import { GlobalController } from '../controllers/globalController';
import { authMiddleware, userTypeMiddleware } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});

const router = Router();

router.use(authMiddleware, userTypeMiddleware('USER'));

// Dashboard
router.get('/dashboard', GlobalController.getDashboard);

// User-company connections
router.get('/connections', GlobalController.getConnections);
router.post('/connections', GlobalController.requestConnection);
router.delete('/connections/:companyId', GlobalController.revokeConnection);

// Per-connection invoices (what the user received FROM that firm)
router.get('/connections/:connectionId/invoices', GlobalController.getConnectionInvoices);
router.post('/connections/:connectionId/invoices', GlobalController.createConnectionInvoice);
router.delete('/connections/:connectionId/invoices/:invoiceId', GlobalController.deleteConnectionInvoice);

// Per-connection files
router.get('/connections/:connectionId/files', GlobalController.getConnectionFiles);
router.post('/connections/:connectionId/files', upload.single('file'), GlobalController.uploadConnectionFile);
router.get('/connections/:connectionId/files/:fileId/download', GlobalController.downloadConnectionFile);
router.delete('/connections/:connectionId/files/:fileId', GlobalController.deleteConnectionFile);

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
