import express from 'express';
import multer from 'multer'; // Import multer
import path from 'path'; // Node.js path module
import fs from 'fs'; // Node.js file system module
import { fileURLToPath } from 'url'; // For ES Modules to get __dirname

const router = express.Router();

// Get __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the absolute path to the uploads directory for profile pictures
// This will resolve to your_backend_root/uploads/profile_pictures
const profileUploadsDir = path.join(__dirname, '..', 'uploads', 'profile_pictures');

// Ensure the directory exists
if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
  console.log(`Created uploads directory at: ${profileUploadsDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadsDir); // Use the robustly defined absolute path
  },
  filename: (req, file, cb) => {
    // Use user ID or a unique ID to name the profile picture
    // For simplicity, using Date.now(). In a real app, use req.user._id if authenticated
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB file size limit for profile pictures
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .jpeg, .jpg, .png image formats are allowed!'));
  }
});

// Import controllers
import {
  registerUser,
  authUser,
  getUsers,
  createUser,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '../controllers/userController.js';

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', authUser);

// --- Admin User Management Routes ---
router.get('/', getUsers);
router.post('/', createUser); // Manual user creation by admin

// --- User Profile Update Route with Multer ---
// This route now expects a 'profilePicture' file field
// The path in userController.js should match the URL served by server.js
router.put('/:id', upload.single('profilePicture'), updateUser); // Apply multer here

router.delete('/:id', deleteUser);

// Route to reset a user's password to a default value
router.put('/:id/reset-password', resetUserPassword); // <-- New route for password reset

// --- Admin Registration Approval Routes ---
router.get('/registrations/pending', getPendingRegistrations);
router.post('/registrations/:id/approve', approveRegistration);
router.delete('/registrations/:id/reject', rejectRegistration);

export default router;
