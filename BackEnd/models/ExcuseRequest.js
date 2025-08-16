import mongoose from 'mongoose';

const excuseRequestSchema = mongoose.Schema(
  {
    studentId: { // Optional: if you have authenticated users
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    regNo: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
    },
    email: {
      type: String,
    },
    address: {
      type: String,
    },
    levelOfStudy: {
      type: String,
    },
    subjectCombo: {
      type: String,
    },
    absences: [ // Array of objects
      {
        courseCode: { type: String },
        date: { type: String }, // Or Date type if you parse it
      },
    ],
    reason: {
      type: String,
      required: true,
    },
    reasonDetails: {
      type: String,
    },
    lectureAbsents: {
      type: String, // Can be Number
    },
    date: { // Date of the application
      type: Date,
      required: true,
    },
    medicalFormPath: { // Path to the uploaded file
      type: String,
    },
    status: {
      type: String,
      default: 'Pending', // Initial status
      enum: ['Pending', 'Approved', 'Rejected'],
    },
    submittedDate: {
      type: Date,
      default: Date.now,
    },
    // You can add fields for who approved/rejected and when
    approvedBy: { type: String },
    rejectedBy: { type: String },
    approvalDate: { type: Date },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const ExcuseRequest = mongoose.model('ExcuseRequest', excuseRequestSchema);

export default ExcuseRequest;