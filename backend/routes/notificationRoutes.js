import express from 'express';
import {
  createNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

export default router;
