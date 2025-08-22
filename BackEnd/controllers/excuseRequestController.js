import ExcuseRequest from '../models/ExcuseRequest.js';
import Notification from '../models/Notification.js';

// @desc    Get all excuse requests (e.g., for admin/staff to view all)
// @route   GET /api/excuse-requests
// @access  Private (Admin/Staff)
const getExcuseRequests = async (req, res) => {
  try {
    const requests = await ExcuseRequest.find({});
    res.json(requests);
  } catch (error) {
    console.error("Error fetching excuse requests:", error);
    res.status(500).json({ message: 'Error fetching excuse requests', error: error.message });
  }
};

// @desc    Get a single excuse request by ID
// @route   GET /api/excuse-requests/:id
// @access  Private (Student, Admin, Approvers)
const getExcuseRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await ExcuseRequest.findById(id);
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

// @desc    Submit an excuse request form with file upload
// @route   POST /api/excuse-requests
// @access  Private (Student)
const createExcuseRequest = async (req, res) => {
  let absences = [];
  if (req.body.absences) {
    try {
      absences = JSON.parse(req.body.absences);
    } catch (e) {
      console.error("Failed to parse absences:", e);
      return res.status(400).json({ message: "Invalid absences format in absences field" });
    }
  }

  const { name, regNo, mobile, email, address, levelOfStudy, subjectCombo, reason, reasonDetails, lectureAbsents, date, studentId, studentName } = req.body;
  const medicalFormPath = req.file ? req.file.path : null;

  if (!name || !regNo || !reason) {
    if (reason === 'illness' && !medicalFormPath) {
      return res.status(400).json({ message: 'Medical form is required for illness reason.' });
    }
    return res.status(400).json({ message: 'Please fill in all required fields (Name, Registration Number, Reason).' });
  }

  try {
    const newExcuseRequest = await ExcuseRequest.create({
      studentId: studentId,
      studentName: studentName, // Save student name here
      name,
      regNo,
      mobile,
      email,
      address,
      levelOfStudy,
      subjectCombo,
      absences,
      reason,
      reasonDetails,
      lectureAbsents,
      date: new Date(date),
      medicalFormPath,
      status: 'Pending',
      submittedDate: new Date(),
    });

    await Notification.create({
      userId: studentId, // Student receives notification
      message: `Your excuse request (${reason}) has been submitted. Status: Pending.`,
      type: 'info',
    });

    // Notify an admin/relevant staff for new excuse request (adjust userId accordingly)
    await Notification.create({
        userId: 'admin_or_staff_id', // Placeholder: This needs to be a specific admin/staff ID or role-based notification logic
        message: `New excuse request from ${name} (${regNo}) for ${reason}.`,
        type: 'info',
    });


    res.status(201).json({ message: 'Excuse Request submitted successfully!', medicalFormPath, excuseRequestId: newExcuseRequest._id });

  } catch (error) {
    console.error("Error submitting excuse request:", error);
    res.status(500).json({ message: 'Error submitting excuse request', error: error.message });
  }
};

export { getExcuseRequests, getExcuseRequestById, createExcuseRequest };
