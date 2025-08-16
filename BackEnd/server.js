import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
// Import Routes
import userRoutes from './routes/userRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import letterRoutes from './routes/letterRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import excuseRequestRoutes from './routes/excuseRequestRoutes.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(cors());
// Middleware to parse JSON body
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/excuse-requests', excuseRequestRoutes);

// Simple root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
