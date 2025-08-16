import Letter from '../models/Letter.js';

// --- APPROVAL STAGE DEFINITIONS (MUST BE CONSISTENT WITH FRONTEND) ---
const approvalStages = [
  { name: "Submitted", approverRole: null },
  { name: "Pending Staff Approval", approverRole: "Staff" },
  { name: "Pending Lecturer Approval", approverRole: "Lecturer" },
  { name: "Pending HOD Approval", approverRole: "HOD" },
  { name: "Pending Dean Approval", approverRole: "Dean" },
  { name: "Pending VC Approval", approverRole: "VC" },
  { name: "Approved", approverRole: null },
  { name: "Rejected", approverRole: null }
];

const submitterRoleToInitialStageIndex = {
  "Student": 1,
  "Staff": 2,
  "Lecturer": 3,
  "HOD": 4,
  "Dean": 5,
  "VC": 6
};

const approverRoleToStageIndex = {
    "Staff": 1,
    "Lecturer": 2,
    "HOD": 3,
    "Dean": 4,
    "VC": 5
};
// --- END APPROVAL STAGE DEFINITIONS ---


const createLetter = async (req, res) => {
    const { type, reason, date, studentId, student, submitterRole, attachments } = req.body;

    const initialStageIndex = submitterRoleToInitialStageIndex[submitterRole] !== undefined
                               ? submitterRoleToInitialStageIndex[submitterRole]
                               : 0;
    const initialStatus = approvalStages[initialStageIndex].name;

    try {
        const letter = await Letter.create({
            type,
            reason,
            date,
            studentId,
            student,
            status: initialStatus,
            currentStageIndex: initialStageIndex,
            submittedDate: new Date(),
            attachments
        });
        res.status(201).json(letter);
    } catch (error) {
        console.error("Error creating letter:", error);
        res.status(500).json({ message: 'Server error creating letter', error: error.message });
    }
};

const getLettersByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        const letters = await Letter.find({ studentId: userId });
        res.json(letters);
    } catch (error) {
        console.error("Error fetching letters by user ID:", error);
        res.status(500).json({ message: 'Server error fetching letters by user ID', error: error.message });
    }
};

// @desc    Get a single letter by its ID
// @route   GET /api/letters/:id
// @access  Private (any authorized user who can view it)
const getLetterById = async (req, res) => {
    const { id } = req.params;
    try {
        // Use findById() to search by MongoDB's _id
        const letter = await Letter.findById(id);
        if (letter) {
            res.json(letter); // Found the letter
        } else {
            // Letter not found with this ID
            res.status(404).json({ message: 'Letter not found' });
        }
    } catch (error) {
        // Log the actual database error
        console.error("Error fetching single letter by ID:", error);
        // Respond with a 500 if there's a server/database issue
        res.status(500).json({ message: 'Server error fetching letter by ID', error: error.message });
    }
};


const getPendingApprovals = async (req, res) => {
    const { statusName } = req.params;

    const isValidStatus = approvalStages.some(stage => stage.name === statusName);
    if (!isValidStatus) {
        return res.status(400).json({ message: 'Invalid status name provided for pending approvals.' });
    }

    try {
        const letters = await Letter.find({ status: statusName });
        res.json(letters);
    } catch (error) {
        console.error("Error fetching pending approvals:", error);
        res.status(500).json({ message: 'Server error fetching approvals', error: error.message });
    }
};


const updateLetterStatus = async (req, res) => {
    const { id } = req.params;
    const { status, currentStageIndex, rejectionReason, approver, approverRole } = req.body;

    try {
        const letter = await Letter.findById(id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        letter.status = status;
        letter.currentStageIndex = currentStageIndex;
        letter.lastUpdated = new Date();

        if (rejectionReason) {
            letter.rejectionReason = rejectionReason;
        } else {
            letter.rejectionReason = undefined;
        }

        letter.approver = approver;
        letter.approverRole = approverRole;

        const updatedLetter = await letter.save();
        res.json(updatedLetter);

    } catch (error) {
        console.error("Error updating letter status:", error);
        res.status(500).json({ message: 'Server error updating letter status', error: error.message });
    }
};

export { createLetter, getLettersByUserId, getLetterById, updateLetterStatus, getPendingApprovals };

