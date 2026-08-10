import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { platformAdminMiddleware } from '../middleware/platformAdmin';

const router = Router();

/**
 * Platform administration routes.
 * Every route here requires a valid session AND isPlatformAdmin === true —
 * this is intentionally separate from the per-company OWNER/ADMIN roles,
 * which must never grant cross-tenant actions.
 */
router.use(authMiddleware, platformAdminMiddleware);

router.get('/locked-accounts', AuthController.listLockedAccounts);
router.post('/locked-accounts/:userId/unlock', AuthController.adminUnlockAccount);

export default router;
