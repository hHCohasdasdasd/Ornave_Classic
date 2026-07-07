import { Router } from 'express';
import { GlobalController } from '../controllers/globalController';
import { authMiddleware, userTypeMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, userTypeMiddleware('USER'));

// Dashboard
router.get('/dashboard', GlobalController.getDashboard);

// User-company connections
router.get('/connections', GlobalController.getConnections);
router.post('/connections', GlobalController.requestConnection);

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
