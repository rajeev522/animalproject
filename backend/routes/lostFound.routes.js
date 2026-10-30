import express from 'express';
import {
  createLostFoundReport,
  getLostFoundReports,
  getLostFoundReportById,
  updateLostFoundReport,
  runAiMatchingForReport,
} from '../controllers/lostFound.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';

const router = express.Router();

// Public / Semi-public listing
router.get('/', optionalAuth, getLostFoundReports);
router.get('/:id', optionalAuth, getLostFoundReportById);

// Submissions: allow both logged-in users and authenticated reporters
router.post('/', optionalAuth, createLostFoundReport);
router.put('/:id', optionalAuth, updateLostFoundReport);
router.post('/:id/match', optionalAuth, runAiMatchingForReport);

export default router;
