import { Router } from 'express';
import { ConnectionController } from '../controllers/connectionController';
import { authMiddleware, companyContextMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Company Connection Routes
 * Prefix: /api/companies/:companyId/connections
 */

// Send connection request
router.post(
  '/:companyId/connections',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.sendConnectionRequest
);

// Get outgoing connections
router.get(
  '/:companyId/connections/outgoing',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.getOutgoingConnections
);

// Get incoming connections
router.get(
  '/:companyId/connections/incoming',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.getIncomingConnections
);

// Get active connections
router.get(
  '/:companyId/connections/active',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.getActiveConnections
);

// Get pending connection count
router.get(
  '/:companyId/connections/pending/count',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.getPendingCount
);

// Get connection details
router.get(
  '/:companyId/connections/:connectionId',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.getConnection
);

// Accept connection
router.patch(
  '/:companyId/connections/:connectionId/accept',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.acceptConnection
);

// Reject connection
router.patch(
  '/:companyId/connections/:connectionId/reject',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.rejectConnection
);

// Block connection
router.patch(
  '/:companyId/connections/:connectionId/block',
  authMiddleware,
  companyContextMiddleware,
  ConnectionController.blockConnection
);

export default router;
