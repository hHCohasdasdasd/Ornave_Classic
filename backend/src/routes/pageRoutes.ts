import { Router } from 'express';
import { PageController } from '../controllers/pageController';
import { authMiddleware, companyContextMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });

/**
 * Page Routes
 * Base: /companies/:companyId/pages
 * Protected routes require authentication
 * Public routes: get published pages, get by slug
 */

// Public routes
router.get('/published', PageController.getPublishedPages);
router.get('/slug/:slug', PageController.getPageBySlug);

// Protected routes
router.get('/', authMiddleware, companyContextMiddleware, PageController.getCompanyPages);
router.post('/', authMiddleware, companyContextMiddleware, PageController.createPage);

router.get('/:pageId', authMiddleware, companyContextMiddleware, PageController.getPage);
router.put('/:pageId', authMiddleware, companyContextMiddleware, PageController.updatePage);
router.patch('/:pageId/layout', authMiddleware, companyContextMiddleware, PageController.updatePageLayout);
router.patch('/:pageId/publish', authMiddleware, companyContextMiddleware, PageController.togglePublish);
router.post('/reorder', authMiddleware, companyContextMiddleware, PageController.reorderPages);
router.delete('/:pageId', authMiddleware, companyContextMiddleware, PageController.deletePage);

export default router;
