import { Router } from 'express';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/register-resident', authController.registerResident);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

export default router;
