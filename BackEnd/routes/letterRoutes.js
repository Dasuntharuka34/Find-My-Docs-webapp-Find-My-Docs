import express from 'express';
const router = express.Router();
import {
  getLettersByUser,
  getPendingApprovals,
  createLetter,
  updateLetterStatus,
} from '../controllers/letterController.js';

router.route('/byUser/:userId').get(getLettersByUser);
router.route('/pendingApprovals/:role').get(getPendingApprovals);
router.route('/').post(createLetter);
router.route('/:id/status').put(updateLetterStatus);

export default router;
