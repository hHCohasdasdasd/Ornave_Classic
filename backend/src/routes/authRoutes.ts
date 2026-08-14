import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { loginRateLimiter, registerRateLimiter, resendVerificationRateLimiter, twoFactorVerifyRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Authentication Routes
 * Public: register, login
 * Protected: profile, changePassword, verifyToken
 */

// Public routes
router.post('/register', registerRateLimiter, AuthController.register);
router.post('/login', loginRateLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification-by-email', resendVerificationRateLimiter, AuthController.resendVerificationByEmail);
router.post('/forgot-password', resendVerificationRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', resendVerificationRateLimiter, AuthController.resetPassword);
router.post('/verify-login-2fa', twoFactorVerifyRateLimiter, AuthController.verifyLogin2FA);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.get('/verify', authMiddleware, AuthController.verifyToken);
router.post('/resend-verification', authMiddleware, AuthController.resendVerification);
router.post('/2fa/setup', authMiddleware, AuthController.setup2FA);
router.post('/2fa/enable', authMiddleware, AuthController.enable2FA);
router.post('/2fa/disable', authMiddleware, AuthController.disable2FA);
router.post('/delete-account', authMiddleware, AuthController.deleteAccount);

export default router;
