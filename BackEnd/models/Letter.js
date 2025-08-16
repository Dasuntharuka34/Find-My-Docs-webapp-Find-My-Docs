import mongoose from 'mongoose';

const letterSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    student: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    attachments: {
      // You can store file path, or use a separate file storage service like S3
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: 'Submitted',
      enum: ['Submitted', 'Checked by Staff', 'Lecturer Approval', 'HOD', 'Dean', 'VC', 'Approved', 'Rejected'],
    },
    currentStageIndex: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    history: [ // To track who approved/rejected and when
      {
        action: { type: String, enum: ['Approved', 'Rejected'] },
        by: { type: String },
        role: { type: String },
        reason: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Letter = mongoose.model('Letter', letterSchema);

export default Letter;