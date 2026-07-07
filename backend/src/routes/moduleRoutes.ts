import { Router } from 'express';
import { ModuleController } from '../controllers/moduleController';
import { authMiddleware, companyContextMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });

/**
 * Module Routes
 * Base: /companies/:companyId/modules
 * All routes are protected - require authentication and company context
 */

// Get modules
router.get('/', authMiddleware, companyContextMiddleware, ModuleController.getCompanyModules);
router.get('/enabled', authMiddleware, companyContextMiddleware, ModuleController.getEnabledModules);
router.get('/:moduleId', authMiddleware, companyContextMiddleware, ModuleController.getModule);

// Create module
router.post('/', authMiddleware, companyContextMiddleware, ModuleController.createModule);

// Update module
router.put('/:moduleId', authMiddleware, companyContextMiddleware, ModuleController.updateModule);

// Toggle visibility
router.patch('/:moduleId/visibility', authMiddleware, companyContextMiddleware, ModuleController.toggleVisibility);

// Reorder modules
router.post('/reorder', authMiddleware, companyContextMiddleware, ModuleController.reorderModules);

// Delete module
router.delete('/:moduleId', authMiddleware, companyContextMiddleware, ModuleController.deleteModule);

export default router;
