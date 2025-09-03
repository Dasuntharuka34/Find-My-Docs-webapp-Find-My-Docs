import ExcuseRequest from '../models/ExcuseRequest.js'; // This model is no longer used for new submissions
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Letter from '../models/Letter.js'; // Import the Letter model

// --- APPROVAL STAGE DEFINITIONS (MUST BE CONSISTENT WITH FRONTEND) ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  // { name: "Pending Staff Approval", approverRole: "Staff" },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];

// Maps submitter roles to the initial stage index for a new letter.
const submitterRoleToInitialStageIndex = {
  "Student": 1,    // Student submits, starts at "Submitted"
  // "Staff": 1,      // Staff submits, skips "Submitted", starts at "Pending Staff Approval"
  "Lecturer": 2,   // Lecturer submits, skips Staff, starts at "Pending Lecturer Approval"
  "HOD": 3,        // HOD submits, skips Staff, Lecturer, starts at "Pending HOD Approval"
  "Dean": 4,       // Dean submits, skips Staff, Lecturer, HOD, starts at "Pending Dean Approval"
  // "VC": 5         // VC submits, directly goes to "Approved" (index 6 in approvalStages)
};
// --- END APPROVAL STAGE DEFINITIONS ---


// @desc    Get all excuse requests (Only for fetching OLD excuse requests if they exist)
// @route   GET /api/excuse-requests
// @access  Private (Admin/Staff)
const getExcuseRequests = async (req, res) => {
  try {
    const requests = await ExcuseRequest.find({}); // Fetch from old ExcuseRequest collection
    res.json(requests);
  } catch (error) {
    console.error("Error fetching excuse requests:", error);
    res.status(500).json({ message: 'Error fetching excuse requests', error: error.message });
  }
};

// @desc    Get a single excuse request by ID (Only for fetching OLD excuse requests if they exist)
// @route   GET /api/excuse-requests/:id
// @access  Private (Student, Admin, Approvers)
const getExcuseRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await ExcuseRequest.findById(id); // Fetch from old ExcuseRequest collection
    if (request) {
      res.json(request);
    } else {
      res.status(404).json({ message: 'Excuse Request not found' });
    }
  } catch (error) {
    console.error("Error fetching single excuse request by ID:", error);
    res.status(500).json({ message: 'Server error fetching excuse request by ID', error: error.message });
  }
};

// @desc    Submit an excuse request form by creating a "Medical Certificate" Letter
// @route   POST /api/excuse-requests (This endpoint will now create a Letter document)
// @access  Private (Student)
const createExcuseRequest = async (req, res) => {
  console.log("Incoming request body:", req.body); // Debugging: Check received form data
  console.log("Incoming file data:", req.file);   // Debugging: Check received file data

  let absences = [];
  if (req.body.absences) {
    try {
      absences = JSON.parse(req.body.absences);
    } catch (e) {
      console.error("Failed to parse absences:", e);
      return res.status(400).json({ message: "Invalid absences format in absences field" });
    }
  }

  // Extract all fields from the request body (which comes from ExcuseRequestForm)
  const { 
    name, regNo, mobile, email, address, levelOfStudy, 
    subjectCombo, reason, reasonDetails, lectureAbsents, date, 
    studentId, studentName, studentRole // studentRole should also be passed from frontend AuthContext
  } = req.body;
  
  const medicalFormPath = req.file ? req.file.path : null; // Path to the uploaded medical form

  // Basic validation for required fields
  if (!name || !regNo || !reason || !studentId || !studentName || !studentRole) {
    console.error("Missing required fields for Medical Certificate Letter:", { name, regNo, reason, studentId, studentName, studentRole });
    if (reason === 'illness' && !medicalFormPath) {
      return res.status(400).json({ message: 'Medical form is required for illness reason.' });
    }
    return res.status(400).json({ message: 'Please fill in all required fields and ensure user data (studentId, studentName, studentRole) is sent correctly.' });
  }

  try {
    // Determine initial stage based on the actual submitter's role (expected to be 'Student')
    const initialStageIndex = submitterRoleToInitialStageIndex[studentRole] || 0;
    const initialStatus = approvalStages[initialStageIndex].name;

    // --- Create a Letter entry for the Medical Certificate directly ---
    const newLetter = await Letter.create({
      type: "Medical Certificate", // Fixed type for this form
      reason: reason, // Main reason from the form (e.g., 'illness')
      date: new Date(date), // Date of absence/application from form
      studentId: studentId,
      student: studentName,
      status: initialStatus,
      currentStageIndex: initialStageIndex,
      submittedDate: new Date(),
      attachments: medicalFormPath, // Attach the medical form here

      // --- Map all ExcuseRequestForm fields directly to the Letter model ---
      regNo: regNo,
      mobile: mobile,
      email: email,
      address: address,
      levelOfStudy: levelOfStudy,
      subjectCombo: subjectCombo,
      absences: absences,
      reasonDetails: reasonDetails,
      lectureAbsents: lectureAbsents,
      // No excuseRequestId linked, as we are not creating a separate ExcuseRequest document
      // (This field exists in the Letter model for backward compatibility with old data)
    });
    // --- End Letter creation for Medical Certificate ---
    
    

    // Notify the student who submitted the request
    await Notification.create({
      userId: studentId, // Student receives notification
      message: `Your Medical Certificate request (${reason}) has been submitted. Status: ${initialStatus}.`,
      type: 'info',
    });

    // 🔔 Notify all Admin and Staff users about the new Medical Certificate Letter
    const adminStaffUsers = await User.find({ role: { $in: ['Admin', 'Staff'] } });

    if (adminStaffUsers.length > 0) {
      for (const adminStaff of adminStaffUsers) {
        await Notification.create({
          userId: adminStaff._id, // Use the actual ObjectId of the admin/staff user
          message: `New Medical Certificate from ${name} (${regNo}) for ${reason}.`,
          type: 'info',
        });
      }
    } else {
      console.warn("No Admin or Staff users found to send Medical Certificate notification.");
    }

    res.status(201).json({ 
      message: 'Medical Certificate Letter submitted successfully!', 
      letterId: newLetter._id, // Return the ID of the new Letter
      medicalFormPath: newLetter.attachments // For confirmation
    });

  } catch (error) {
    console.error("Error submitting Medical Certificate Letter:", error);
    // Ensure error response is JSON for frontend to parse correctly
    console.error("❌ Error creating ExcuseRequest:", error);  // <-- will show exact cause
    res.status(500).json({ message: "Error submitting Medical Certificate Letter", error: error.message });
  }
};

export { getExcuseRequests, getExcuseRequestById, createExcuseRequest };
