import express from 'express';
const router = express.Router();
import {
  createLetter,
  getLettersByUserId,
  updateLetterStatus,
  getPendingApprovals,
  getLetterById // Ensure this is correctly imported
} from '../controllers/letterController.js';

// Route to create a new letter
router.post('/', createLetter);

// Route to get letters by a specific user ID
router.get('/byUser/:userId', getLettersByUserId);

// Route to get pending approvals for a specific status name
router.get('/pendingApprovals/:statusName', getPendingApprovals);

// Route to update letter status (Approve/Reject)
router.put('/:id/status', updateLetterStatus);

// IMPORTANT: Route to get a single letter by its ID.
// This route should come *after* specific routes like /byUser and /pendingApprovals
// but *before* any generic routes that might capture the ID as a different parameter
router.get('/:id', getLetterById); // This is the route for DocumentsView

export default router;
