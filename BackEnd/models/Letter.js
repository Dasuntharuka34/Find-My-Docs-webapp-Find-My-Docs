import mongoose from 'mongoose';

const letterSchema = mongoose.Schema(
    {
        type: { type: String, required: true },
        reason: { type: String, required: true },
        date: { type: Date, required: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        student: { type: String, required: true }, // Student's name for display
        status: { type: String, required: true, default: 'Submitted' },
        currentStageIndex: { type: Number, required: true, default: 0 },
        submittedDate: { type: Date, default: Date.now },
        attachments: { type: String }, // Path to uploaded file if any

        // --- NEW FIELDS FOR APPROVAL FLOW ---
        approver: { type: String }, // Name of the last approver
        approverRole: { type: String }, // Role of the last approver (e.g., 'Lecturer', 'HOD')
        rejectionReason: { type: String }, // Reason if rejected
        // --- END NEW FIELDS ---
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt timestamps
    }
);

const Letter = mongoose.model('Letter', letterSchema);

export default Letter;
