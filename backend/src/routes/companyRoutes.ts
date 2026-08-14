import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { authMiddleware, companyContextMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Company Routes
 * Public: create company, get by slug
 * Protected: get details, update settings, manage users, regenerate token
 */

// Public routes
router.post('/', CompanyController.createCompany);
router.get('/slug/:slug', CompanyController.getCompanyBySlug);

// Protected routes
router.get('/:companyId', authMiddleware, companyContextMiddleware, CompanyController.getCompany);
router.put('/:companyId/settings', authMiddleware, companyContextMiddleware, CompanyController.updateSettings);
router.put('/:companyId/banner', authMiddleware, companyContextMiddleware, CompanyController.updateBanner);
router.put('/:companyId/logo', authMiddleware, companyContextMiddleware, CompanyController.updateLogo);
router.get('/:companyId/users', authMiddleware, companyContextMiddleware, CompanyController.getCompanyUsers);
router.post('/:companyId/regenerate-token', authMiddleware, companyContextMiddleware, CompanyController.regenerateToken);
router.delete('/:companyId', authMiddleware, companyContextMiddleware, CompanyController.deactivateCompany);

export default router;
