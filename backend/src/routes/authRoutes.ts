import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Authentication Routes
 * Public: register, login
 * Protected: profile, changePassword, verifyToken
 */

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.get('/verify', authMiddleware, AuthController.verifyToken);

export default router;
