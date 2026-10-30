import express from 'express';
import {
  listAvailable,
  getListingById,
  applyForAdoption,
  getMyRequests,
  adminGetDogs,
  adminAddDog,
  adminUpdateDog,
  adminDeleteDog,
  adminGetRequests,
  adminUpdateRequestStatus,
  adminGetAdoptionStats,
  adminGetNotifications,
  adminMarkNotificationsRead
} from '../controllers/adoption.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ── Public & Authenticated User Routes ──
router.get('/', listAvailable);
router.get('/my-requests', authenticateUser, getMyRequests);
router.get('/:id', getListingById);
router.post('/:id/apply', authenticateUser, applyForAdoption);

// ── NGO Admin Management Routes ──
router.get('/admin/all', authenticateUser, requireRole('admin', 'ngo_admin'), adminGetDogs);
router.post('/admin/dog', authenticateUser, requireRole('admin', 'ngo_admin'), adminAddDog);
router.put('/admin/dog/:id', authenticateUser, requireRole('admin', 'ngo_admin'), adminUpdateDog);
router.delete('/admin/dog/:id', authenticateUser, requireRole('admin', 'ngo_admin'), adminDeleteDog);

router.get('/admin/requests', authenticateUser, requireRole('admin', 'ngo_admin'), adminGetRequests);
router.patch('/admin/requests/:id/status', authenticateUser, requireRole('admin', 'ngo_admin'), adminUpdateRequestStatus);
router.get('/admin/stats', authenticateUser, requireRole('admin', 'ngo_admin'), adminGetAdoptionStats);
router.get('/admin/notifications', authenticateUser, requireRole('admin', 'ngo_admin'), adminGetNotifications);
router.patch('/admin/notifications/mark-read', authenticateUser, requireRole('admin', 'ngo_admin'), adminMarkNotificationsRead);

export default router;
