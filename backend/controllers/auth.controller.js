import 'dotenv/config';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';
import sendSMS from '../utils/sendSMS.js';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';
import logger from '../config/logger.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'super_secret_dev_key';

export function userToClient(userDoc) {
  const o = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  return {
    ...o,
    id: o._id?.toString(),
  };
}

/**
 * GET /api/auth/me
 * Restores and returns authenticated user from verified token
 */
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }
    return res.status(200).json({
      success: true,
      user: userToClient(req.user),
    });
  } catch (error) {
    logger.error(`GetMe Error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
};

/**
 * POST /api/auth/send-otp
 */
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });

    // Generate a secure 6 digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear any existing OTP for this phone
    await OTP.deleteMany({ phone });

    // Save new OTP strictly to DB
    await OTP.create({ phone, code: otpCode });

    const smsText = `[PawRescue] Your verification code is: ${otpCode}`;

    logger.info(`[Twilio Fallback Log] Sending SMS to ${phone} : ${smsText}`);

    // Realtime dispatches
    await sendSMS(phone, smsText);

    const officialEmail = process.env.OFFICIAL_RESCUE_EMAIL || 'officialgooglemail@example.com';
    const emailSubject = `[PawRescue Alert] Real-time OTP Request for ${phone}`;
    const emailHtml = `
      <h3>New OTP Code Generated</h3>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Code:</b> ${otpCode}</p>
      <hr />
      <p><small>Automated dispatch from PawRescue Security Service</small></p>
    `;

    await sendEmail(officialEmail, emailSubject, smsText, emailHtml);

    res.status(200).json({ success: true, message: 'OTP sent and logged successfully.' });
  } catch (error) {
    logger.error(`Send OTP Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error generating OTP', error: error.message });
  }
};

/**
 * POST /api/auth/otp
 */
export const otpLogin = async (req, res) => {
  try {
    const { phone, code, role, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone and OTP code are required.' });
    }

    // Authentic server-side verification check
    const validOtp = await OTP.findOne({ phone, code });
    if (!validOtp) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    // Clear verification ticket after successful usage
    await OTP.deleteOne({ _id: validOtp._id });

    const requestedRole = (role === 'admin' || role === 'ngo_admin') ? 'admin' : 'reporter';

    // Check if account already exists
    let user = await User.findOne({ phone });

    if (user) {
      const existingRole = (user.role === 'ngo_admin' || user.role === 'admin') ? 'admin' : 'reporter';
      if (existingRole !== requestedRole) {
        return res.status(403).json({
          success: false,
          code: 'ROLE_MISMATCH',
          message: requestedRole === 'admin'
            ? 'This phone number is registered as a Reporter. Please switch to the Reporter login tab.'
            : 'This phone number is registered as an NGO Admin. Please switch to the NGO Admin login tab.',
        });
      }
    } else {
      // New user signup
      user = await User.create({
        name: name || (requestedRole === 'admin' ? 'New NGO' : 'New Reporter (OTP)'),
        phone,
        role: requestedRole,
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
    res.status(200).json({ success: true, token, user: userToClient(user) });
  } catch (error) {
    logger.error(`OTP Validation Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error during OTP validation', error: error.message });
  }
};

let googleClientInstance = null;
const getGoogleClient = () => {
  if (!googleClientInstance) {
    googleClientInstance = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClientInstance;
};

/**
 * POST /api/auth/google
 */
export const googleLogin = async (req, res) => {
  try {
    const { idToken, role, name } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'idToken is required.' });

    // Verify token with Google explicitly
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userEmail = (payload.email || '').toLowerCase();
    const userName = payload.name;

    const requestedRole = (role === 'admin' || role === 'ngo_admin') ? 'admin' : 'reporter';

    let user = await User.findOne({ email: userEmail });

    if (user) {
      const existingRole = (user.role === 'ngo_admin' || user.role === 'admin') ? 'admin' : 'reporter';
      if (existingRole !== requestedRole) {
        return res.status(403).json({
          success: false,
          code: 'ROLE_MISMATCH',
          message: requestedRole === 'admin'
            ? 'This Google account is registered as a Reporter. Please switch to the Reporter login tab.'
            : 'This Google account is registered as an NGO Admin. Please switch to the NGO Admin login tab.',
        });
      }
    } else {
      // New user registration
      user = await User.create({
        name: name || (requestedRole === 'admin' ? `${userName} NGO` : userName),
        email: userEmail,
        role: requestedRole,
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
    res.status(200).json({ success: true, token, user: userToClient(user) });
  } catch (error) {
    logger.error(`Error in Google Login: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error in Google Login', error: error.message });
  }
};
