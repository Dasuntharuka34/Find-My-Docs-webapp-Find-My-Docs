import LeaveRequest from '../models/LeaveRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// --- APPROVAL STAGE DEFINITIONS (ඉල්ලීම් අනුමත කිරීමේ අදියරයන්) ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  // { name: "Rejected", approverRole: null }
];

// ඉල්ලීමක් ඉදිරිපත් කරන පුද්ගලයාගේ භූමිකාව අනුව ආරම්භක අදියර තීරණය කිරීම
const submitterRoleToInitialStageIndex = {
  "Student": 1,
  "Lecturer": 2, // Lecturer submits, skips Staff, starts at "Pending Lecturer Approval"
  "HOD": 3,      // HOD submits, skips Staff, Lecturer, starts at "Pending HOD Approval"
  "Dean": 4,
};
// --- END APPROVAL STAGE DEFINITIONS ---

// @desc    Create a new leave request
// @route   POST /api/leaverequests
// @access  Private
const createLeaveRequest = async (req, res) => {
  try {
    const {
      requesterId,
      requesterName,
      requesterRole, // Changed from studentRole to requesterRole
      reason,
      startDate,
      endDate,
      attachments,
      reasonDetails,
      contactDuringLeave,
      remarks,
    } = req.body;

    if (!requesterId || !requesterName || !requesterRole || !reason || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Determine initial stage based on the submitter's role (Lecturer, HOD, Dean)
    const initialStageIndex = submitterRoleToInitialStageIndex[requesterRole] || 0;
    const initialStatus = approvalStages[initialStageIndex].name;
    const firstApproverRole = approvalStages[initialStageIndex].approverRole;

    const newRequest = new LeaveRequest({
      studentId: requesterId, // Correctly map to studentId in model
      studentName: requesterName, // Correctly map to studentName in model
      reason,
      reasonDetails,
      contactDuringLeave,
      remarks,
      startDate,
      endDate,
      attachments, // This will be the file path from multer
      status: initialStatus,
      currentStageIndex: initialStageIndex,
      submittedDate: new Date(),
      // The attachments field on the model is a String.
      // In a real app, you would save the file using multer, get the path, and save that path.
      // For now, let's assume the frontend sends the file as a string (base64 or URL).
      attachments: req.file ? req.file.path : null // Use multer's file path if file was uploaded
    });

    // Add the first stage to the approvals array
    newRequest.approvals.push({
      approverRole: approvalStages[initialStageIndex].approverRole,
      status: 'pending'
    });

    const createdRequest = await newRequest.save();

    // 🔔 Notify the requester
    await Notification.create({
      userId: requesterId,
      message: `Your leave request has been submitted. Status: ${initialStatus}.`,
      type: 'info',
    });

    // 🔔 Notify the first approver role
    if (firstApproverRole) {
      const approvers = await User.find({ role: firstApproverRole });
      if (approvers.length > 0) {
        for (const approver of approvers) {
          await Notification.create({
            userId: approver._id,
            message: `New leave request from ${requesterName} is awaiting your approval.`,
            type: 'info',
          });
        }
      } else {
        console.warn(`No users with role '${firstApproverRole}' found to send notification.`);
      }
    }

    res.status(201).json({ message: 'Leave request submitted successfully!', request: createdRequest });

  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
};

// --- FIX STARTS HERE ---
// @desc    Get all pending leave requests for a specific status
// @route   GET /api/leaverequests/pendingApprovals/:status
// @access  Private
const getPendingLeaveRequests = async (req, res) => {
  try {
    const { status } = req.params;
    const requests = await LeaveRequest.find({ status: status });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching pending leave requests:", error);
    res.status(500).json({ message: 'Error fetching pending leave requests', error: error.message });
  }
};
// --- FIX ENDS HERE ---

// @desc    Get all leave requests (for all approvers)
// @route   GET /api/leaverequests
// @access  Private
const getLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({});
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching all leave requests:", error);
    res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
  }
};

// @desc    Get a single leave request by ID
// @route   GET /api/leaverequests/:id
// @access  Private
const getLeaveRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await LeaveRequest.findById(id);
    if (request) {
      res.json(request);
    } else {
      res.status(404).json({ message: 'Leave request not found' });
    }
  } catch (error) {
    console.error("Error fetching leave request by ID:", error);
    res.status(500).json({ message: 'Server error fetching leave request by ID', error: error.message });
  }
};

// @desc    Get leave requests for a logged-in user
// @route   GET /api/leaverequests/byUser/:userId
// @access  Private
const getLeaveRequestsByUserId = async (req, res) => {
  // Now we get the user ID from the URL parameters instead of the query string
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  try {
    const requests = await LeaveRequest.find({ studentId: userId });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching user's leave requests:", error);
    res.status(500).json({ message: "Server error when fetching user's leave requests", error: error.message });
  }
};

// @desc    Handle approval for a leave request
// @route   PUT /api/leaverequests/:id/approve
// @access  Private (e.g., approver roles)
const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const approverRole = req.body.approverRole;

    const request = await LeaveRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const nextExpectedApprover = approvalStages[request.currentStageIndex].approverRole;
    if (approverRole !== nextExpectedApprover) {
      return res.status(403).json({ message: 'You are not authorized to approve this request at this stage.' });
    }

    const nextStageIndex = request.currentStageIndex + 1;
    const nextStage = approvalStages[nextStageIndex];

    request.currentStageIndex = nextStageIndex;
    request.status = nextStage.name;
    request.approvals.push({
      approverRole: approverRole,
      status: 'approved',
      approvedAt: new Date()
    });

    await request.save();

    await Notification.create({
      userId: request.studentId,
      message: `Your leave request for ${request.reason} has been approved by ${approverRole}. Current status: ${nextStage.name}.`,
      type: 'info',
    });

    if (nextStage.approverRole) {
      const nextApprovers = await User.find({ role: nextStage.approverRole });
      if (nextApprovers.length > 0) {
        for (const approver of nextApprovers) {
          await Notification.create({
            userId: approver._id,
            message: `New leave request from ${request.studentName} is awaiting your approval.`,
            type: 'info',
          });
        }
      } else {
        console.warn(`No users with role '${nextStage.approverRole}' found to send notification.`);
      }
    } else {
      await Notification.create({
        userId: request.studentId,
        message: `Your leave request for ${request.reason} has been fully APPROVED.`,
        type: 'success',
      });
    }

    res.status(200).json({ message: 'Leave request approved successfully!', request });

  } catch (error) {
    console.error("Error approving leave request:", error);
    res.status(500).json({ message: 'Error approving leave request', error: error.message });
  }
};

// @desc    Handle rejection for a leave request
// @route   PUT /api/leaverequests/:id/reject
// @access  Private (e.g., approver roles)
const rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const approverRole = req.body.approverRole;

    const request = await LeaveRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const nextExpectedApprover = approvalStages[request.currentStageIndex].approverRole;
    if (approverRole !== nextExpectedApprover) {
      return res.status(403).json({ message: 'You are not authorized to reject this request at this stage.' });
    }

    request.status = 'Rejected';
    request.approvals.push({
      approverRole: approverRole,
      status: 'rejected',
      approvedAt: new Date()
    });

    await request.save();

    await Notification.create({
      userId: request.studentId,
      message: `Your leave request for ${request.reason} has been REJECTED by ${approverRole}.`,
      type: 'error',
    });

    res.status(200).json({ message: 'Leave request rejected.', request });

  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({ message: 'Error rejecting leave request', error: error.message });
  }
};

// @desc    Delete a leave request
// @route   DELETE /api/leaverequests/:id
// @access  Private (e.g., student who created it or admin)
const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id);

    if (request) {
      await request.deleteOne();
      res.json({ message: 'Leave request removed' });
    } else {
      res.status(404).json({ message: 'Leave request not found' });
    }
  } catch (error) {
    console.error("Error deleting leave request:", error);
    res.status(500).json({ message: 'Server error when deleting a leave request', error: error.message });
  }
};

export {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  getLeaveRequestsByUserId, // Renamed and exported correctly
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
  // --- EXPORT THE NEW FUNCTION ---
  getPendingLeaveRequests
};