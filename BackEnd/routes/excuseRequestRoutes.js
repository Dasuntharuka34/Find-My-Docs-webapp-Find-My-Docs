import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import {
  getExcuseRequests,
  getExcuseRequestById, // <-- New import
  createExcuseRequest
} from '../controllers/excuseRequestController.js'; // <-- Import functions from controller

const router = express.Router();

// Ensure the 'uploads' directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .pdf, .jpg, .jpeg, .png, .doc, .docx formats are allowed!'));
  }
});

// @desc    Submit an excuse request form with file upload
// @route   POST /api/excuse-requests
router.post('/', upload.single('medicalForm'), createExcuseRequest); // Using the imported controller function

// @desc    Get all excuse requests
// @route   GET /api/excuse-requests
router.get('/', getExcuseRequests);

// @desc    Get a single excuse request by ID
// @route   GET /api/excuse-requests/:id
router.get('/:id', getExcuseRequestById); // <-- New route for fetching by ID

export default router;
