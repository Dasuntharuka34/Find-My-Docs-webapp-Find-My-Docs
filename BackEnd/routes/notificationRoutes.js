import express from 'express';
const router = express.Router();
import {
  getNotificationsByUser,
  createNotification,
  markNotificationAsRead,
} from '../controllers/notificationController.js';

router.route('/byUser/:userId').get(getNotificationsByUser);
router.route('/').post(createNotification);
router.route('/:id/read').put(markNotificationAsRead);

export default router;
