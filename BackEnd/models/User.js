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
      unique: true, // Ensures each email is unique in the database
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: 'Student', // Default role for new users if not specified
      // Add more roles as needed: 'Student', 'Staff', 'Lecturer', 'HOD', 'Dean', 'VC', 'Admin'
    },
    department: {
      type: String,
      // Required for staff, lecturers, HODs, Deans, VCs, Admins
      // Not required for students
    },
    indexNumber: {
      type: String,
      // Required for students
      // Not required for other roles
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

const User = mongoose.model('User', userSchema);

export default User;
