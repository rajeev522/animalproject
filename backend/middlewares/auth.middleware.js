import 'dotenv/config';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'super_secret_dev_key';

/**
 * Middleware to authenticate requests via Bearer JWT
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please sign in again.',
        });
      }
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Invalid session token. Please sign in again.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Malformed session token.',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User account not found. Please register or sign in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth Middleware Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server authentication error.',
    });
  }
};

/**
 * Middleware to restrict endpoints to specific user roles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Treat 'ngo_admin' and 'admin' as equivalent for NGO panel authorization
    const normalizedUserRole = req.user.role === 'ngo_admin' ? 'admin' : req.user.role;
    const normalizedAllowed = allowedRoles.map((r) => (r === 'ngo_admin' ? 'admin' : r));

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        code: 'ROLE_FORBIDDEN',
        message: `Forbidden: this resource requires one of [${allowedRoles.join(', ')}] role. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};
