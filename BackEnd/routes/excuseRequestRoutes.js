import express from 'express';
import multer from 'multer';
import path from 'path'; // Node.js built-in path module
import fs from 'fs'; // Node.js built-in file system module

// Import the ExcuseRequest model
import ExcuseRequest from '../models/ExcuseRequest.js'; 
import Notification from '../models/Notification.js'; // Assuming you have a Notification model

const router = express.Router();

// Ensure the 'uploads' directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify the directory where uploaded files will be stored
    cb(null, uploadsDir); 
  },
  filename: (req, file, cb) => {
    // Rename the file to avoid conflicts
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Create the multer upload middleware
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Allow only specific file types (e.g., PDF, common image formats)
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
// @access  Private (Student - Authentication middleware should be added here later)
router.post('/', upload.single('medicalForm'), async (req, res) => {
  // `upload.single('medicalForm')` handles the file upload.
  // The file info will be in `req.file`
  // Other form fields will be in `req.body`

  // Parse absences array from string to JSON
  let absences = [];
  if (req.body.absences) {
    try {
      absences = JSON.parse(req.body.absences);
    } catch (e) {
      console.error("Failed to parse absences:", e);
      return res.status(400).json({ message: "Invalid absences format in absences field" });
    }
  }

  // Extract other form fields
  const { name, regNo, mobile, email, address, levelOfStudy, subjectCombo, reason, reasonDetails, lectureAbsents, date, studentId } = req.body;
  const medicalFormPath = req.file ? req.file.path : null; // Path to the uploaded file

  // Basic validation (can be more robust with a validation library like express-validator)
  if (!name || !regNo || !reason) {
    // If medical form is required for 'illness' reason, add logic here
    if (reason === 'illness' && !medicalFormPath) {
      return res.status(400).json({ message: 'Medical form is required for illness reason.' });
    }
    return res.status(400).json({ message: 'Please fill in all required fields (Name, Registration Number, Reason).' });
  }

  try {
    // Save this data to MongoDB using the ExcuseRequest model.
    const newExcuseRequest = await ExcuseRequest.create({
      studentId: studentId || null, // Ensure this ID comes from authenticated user
      name,
      regNo,
      mobile,
      email,
      address,
      levelOfStudy,
      subjectCombo,
      absences, // Already parsed to array of objects
      reason,
      reasonDetails,
      lectureAbsents,
      date: new Date(date), // Convert date string to Date object
      medicalFormPath, // Save the path to the uploaded file
      status: 'Pending', // Initial status for an excuse request
      submittedDate: new Date(),
    });

    // Create a notification for the relevant staff/lecturer (example)
    // You'll need to determine who to notify based on role/department
    // For simplicity, let's assume a generic admin/staff user for now
    await Notification.create({
      // Replace with actual ID of the person to notify (e.g., department HOD, specific staff member)
      // This userId would come from your user management system based on the student's department/level
      userId: 'admin_or_staff_id', // Placeholder: You need to define this logic
      message: `New excuse request from ${name} (${regNo}) for ${reason}.`,
      type: 'info',
    });

    res.status(201).json({ message: 'Excuse Request submitted successfully!', medicalFormPath, excuseRequestId: newExcuseRequest._id });

  } catch (error) {
    console.error("Error submitting excuse request:", error);
    res.status(500).json({ message: 'Error submitting excuse request', error: error.message });
  }
});

export default router;
