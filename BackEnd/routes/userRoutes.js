import express from 'express';
const router = express.Router();
import {
  registerUser,           // For public registration
  authUser,               // For user login
  getUsers,               // For admin to get all approved users
  createUser,             // For admin to manually create users (if needed)
  getPendingRegistrations, // For admin to get pending registration requests
  approveRegistration,    // For admin to approve a registration
  rejectRegistration,     // For admin to reject a registration
  updateUser,             // For admin to update users
  deleteUser              // For admin to delete users
} from '../controllers/userController.js';

// --- Public Routes ---
// Route for new user registration request
router.post('/register', registerUser);

// Route for user login
router.post('/login', authUser);

// --- Admin User Management Routes ---
// Note: In a production application, these routes would typically be protected
// by authentication and authorization middleware (e.g., JWT verification, role-based checks)

// Route to get all approved users
router.get('/', getUsers);

// Route to manually create a new user (admin specific)
router.post('/', createUser);

// Route to update an existing user by ID
router.put('/:id', updateUser);

// Route to delete a user by ID
router.delete('/:id', deleteUser);

// --- Admin Registration Approval Routes ---
// Route to get all pending registration requests
router.get('/registrations/pending', getPendingRegistrations);

// Route to approve a specific registration request (creates user, deletes request)
router.post('/registrations/:id/approve', approveRegistration);

// Route to reject a specific registration request (deletes request)
router.delete('/registrations/:id/reject', rejectRegistration);

export default router;
