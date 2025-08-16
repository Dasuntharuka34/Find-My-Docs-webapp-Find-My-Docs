import mongoose from 'mongoose';

const registrationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Student', 'Staff', 'Lecturer', 'HOD', 'Dean', 'VC'],
    },
    indexNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    department: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;