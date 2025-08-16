import Letter from '../models/Letter.js';
import Notification from '../models/Notification.js'; // For sending notifications

// @desc    Get all letters for a specific user
// @route   GET /api/letters/byUser/:userId
// @access  Private (User specific)
const getLettersByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const letters = await Letter.find({ studentId: userId }).sort({ createdAt: -1 });
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching letters for user', error: error.message });
  }
};

// @desc    Get letters pending approval for a specific role
// @route   GET /api/letters/pendingApprovals/:role
// @access  Private (Approver specific)
const getPendingApprovals = async (req, res) => {
  const { role } = req.params;
  // This logic assumes a sequential approval flow
  const stages = ["Submitted", "Checked by Staff", "Lecturer Approval", "HOD", "Dean", "VC"];

  try {
    let queryStatus;
    // Determine the status based on the approver's role
    // This needs to be carefully aligned with your 'stages' array and workflow
    if (role === 'Staff') queryStatus = 'Submitted'; // Staff checks after submission
    else if (role === 'Lecturer') queryStatus = 'Checked by Staff'; // Lecturer approves after Staff
    else if (role === 'HOD') queryStatus = 'Lecturer Approval'; // HOD approves after Lecturer
    else if (role === 'Dean') queryStatus = 'HOD'; // Dean approves after HOD
    else if (role === 'VC') queryStatus = 'Dean'; // VC approves after Dean
    else {
      return res.status(400).json({ message: 'Invalid approver role' });
    }

    const letters = await Letter.find({ status: queryStatus, studentId: { $ne: null } })
                                 .populate('studentId', 'name email') // Optional: populate student details
                                 .sort({ createdAt: 1 }); // Oldest first

    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending approvals', error: error.message });
  }
};

// @desc    Submit a new letter request
// @route   POST /api/letters
// @access  Private (Student)
const createLetter = async (req, res) => {
  const { studentId, student, type, reason, date, attachments } = req.body;
  // attachments will be a file. You will need multer middleware for file uploads.
  // For now, we'll assume `attachments` is a string (e.g., file path/URL)
  // If you are sending FormData, `req.body` will contain other fields.

  try {
    const letter = await Letter.create({
      studentId,
      student,
      type,
      reason,
      date,
      attachments, // This should be the path/URL to the uploaded file
      status: 'Submitted',
      currentStageIndex: 0,
      lastUpdated: new Date(),
    });

    // Create a notification for the admin/next approver
    await Notification.create({
      userId: studentId, // Or the ID of the next approver's role
      message: `New letter request submitted by ${student} for ${type}.`,
      type: 'info',
    });

    if (letter) {
      res.status(201).json({
        _id: letter._id,
        message: 'Letter submitted successfully',
      });
    } else {
      res.status(400).json({ message: 'Invalid letter data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error submitting letter', error: error.message });
  }
};

// @desc    Update letter status (approve/reject)
// @route   PUT /api/letters/:id/status
// @access  Private (Approver)
const updateLetterStatus = async (req, res) => {
  const { id } = req.params;
  const { status, currentStageIndex, rejectionReason, approver, approverRole } = req.body;

  try {
    const letter = await Letter.findById(id);

    if (letter) {
      letter.status = status;
      letter.currentStageIndex = currentStageIndex;
      letter.lastUpdated = new Date();

      if (rejectionReason) {
        letter.rejectionReason = rejectionReason;
      }

      // Add to history
      letter.history.push({
        action: status === 'Rejected' ? 'Rejected' : 'Approved',
        by: approver,
        role: approverRole,
        reason: rejectionReason || '',
        timestamp: new Date(),
      });

      const updatedLetter = await letter.save();

      // Create a notification for the student
      await Notification.create({
        userId: updatedLetter.studentId,
        message: `Your letter for ${updatedLetter.type} has been ${status.toLowerCase()}${status === 'Rejected' ? ` (Reason: ${rejectionReason})` : ''}. Current status: ${status}.`,
        type: status === 'Approved' ? 'success' : (status === 'Rejected' ? 'error' : 'info'),
      });

      res.json({
        _id: updatedLetter._id,
        status: updatedLetter.status,
        message: `Letter status updated to ${updatedLetter.status}`,
      });
    } else {
      res.status(404).json({ message: 'Letter not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating letter status', error: error.message });
  }
};

export { getLettersByUser, getPendingApprovals, createLetter, updateLetterStatus };
