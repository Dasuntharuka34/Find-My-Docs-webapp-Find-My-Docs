import express from 'express';
const router = express.Router();
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  authUser, // <-- authUser import කරන්න
} from '../controllers/userController.js';

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);
router.post('/login', authUser); // <-- Login route එක එකතු කරන්න

export default router;
