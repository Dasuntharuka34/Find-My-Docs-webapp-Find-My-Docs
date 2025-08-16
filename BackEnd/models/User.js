import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
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
    password: { // We will hash this later
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Student', 'Staff', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin'],
    },
    // Optional fields based on role
    indexNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows null values
    },
    department: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;