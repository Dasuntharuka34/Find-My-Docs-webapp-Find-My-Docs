// server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Import cors
import path from 'path'; // Node.js path module
import { fileURLToPath } from 'url'; // For ES Modules to get __dirname
import fs from 'fs'; // Import fs module

import connectDB from './config/db.js';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import letterRoutes from './routes/letterRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import excuseRequestRoutes from './routes/excuseRequestRoutes.js';
import leaveRequestRoutes from './routes/LeaveRequestRoutes.js'; // Import the new leave request routes

dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(cors()); // Enable CORS for all origins

// Middleware to parse JSON body
app.use(express.json());

// Get __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Serve static files from the 'uploads' directory ---
// Ensure the base uploads directory exists
const uploadsBaseDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
  console.log(`Created base uploads directory at: ${uploadsBaseDir}`);
}

// Ensure the profile_pictures subdirectory exists
const profilePicturesDir = path.join(uploadsBaseDir, 'profile_pictures');
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
  console.log(`Created profile_pictures directory at: ${profilePicturesDir}`);
}

app.use('/uploads', express.static(uploadsBaseDir)); // Make 'uploads' directory accessible publicly

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/excuse-requests', excuseRequestRoutes);
app.use('/api/leaverequests', leaveRequestRoutes); // Add the new leave request route here

// Simple root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
