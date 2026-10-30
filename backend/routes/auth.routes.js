import express from 'express';
import { sendOtp, otpLogin, googleLogin, getMe } from '../controllers/auth.controller.js';
import validateRequest from '../middlewares/validate.middleware.js';
import { sendOtpSchema, verifyOtpSchema, googleAuthSchema } from '../validators/auth.validator.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Current session validation endpoint
router.get('/me', authenticateUser, getMe);

// Login endpoints with Zod
router.post('/send-otp', validateRequest(sendOtpSchema), sendOtp);
router.post('/otp', validateRequest(verifyOtpSchema), otpLogin);
router.post('/google', validateRequest(googleAuthSchema), googleLogin);

export default router;
