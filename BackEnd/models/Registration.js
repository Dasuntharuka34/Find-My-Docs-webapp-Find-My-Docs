import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // For pre-saving password hashing

const registrationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure uniqueness for pending registrations too
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: 'Student',
    },
    department: {
      type: String,
    },
    indexNumber: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: 'pending', // Default status for new registrations
      enum: ['pending', 'approved', 'rejected'], // Possible statuses
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Pre-save hook to hash password before saving the registration request
registrationSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next(); // Only hash if password field is modified
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
