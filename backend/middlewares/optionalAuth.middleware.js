import 'dotenv/config';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'super_secret_dev_key';

/**
 * Optional authentication middleware:
 * Attaches req.user if a valid token is provided, but does not block requests if no token is present.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, getJwtSecret());
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    } catch {
      // Ignored for optional auth
    }
    next();
  } catch (error) {
    next();
  }
};
