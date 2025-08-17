import User from '../models/User.js';
import Registration from '../models/Registration.js'; // Import Registration model
import bcrypt from 'bcryptjs'; // For password hashing and comparison
import jwt from 'jsonwebtoken'; // For generating JSON Web Tokens

// Function to generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expires in 1 hour
  });
};

// @desc    Register a new user (Creates a pending registration request)
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, department, indexNumber } = req.body;

  try {
    // Check if a user with the provided email already exists in User collection
    const userExists = await User.findOne({ email });
    // Check if a registration request with this email is already pending
    const registrationPending = await Registration.findOne({ email, status: 'pending' });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email is already registered.' });
    }
    if (registrationPending) {
      return res.status(400).json({ message: 'A registration request with this email is already pending admin approval.' });
    }

    // Create a new registration request in the Registration collection
    const registration = await Registration.create({
      name,
      email,
      password, // Password will be hashed by the pre-save hook in Registration model
      role,
      department: role !== 'Student' ? department : undefined,
      indexNumber: role === 'Student' ? indexNumber : undefined,
      status: 'pending', // Set status to pending
    });

    if (registration) {
      res.status(201).json({
        message: 'Registration request submitted successfully! Your account is pending admin approval.',
        status: 'pending',
      });
    } else {
      res.status(400).json({ message: 'Invalid registration data.' });
    }
  } catch (error) {
    console.error('Error during user registration request:', error);
    res.status(500).json({ message: 'Server error during registration request.', error: error.message });
  }
};

// @desc    Authenticate user & get token (User Login)
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        indexNumber: user.indexNumber,
      },
      token,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get all approved users (for Admin dashboard)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// @desc    Create a new user (This can be used by Admin to manually add already approved users if needed)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { name, email, password, role, indexNumber, department } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      indexNumber: role === 'Student' ? indexNumber : undefined,
      department,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'User created successfully by admin',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// @desc    Get all pending registration requests (for Admin dashboard)
// @route   GET /api/users/registrations/pending
// @access  Private/Admin
const getPendingRegistrations = async (req, res) => {
  try {
    const pendingRequests = await Registration.find({ status: 'pending' });
    res.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({ message: 'Error fetching pending registrations', error: error.message });
  }
};

// @desc    Approve a registration request
// @route   POST /api/users/registrations/:id/approve
// @access  Private/Admin
const approveRegistration = async (req, res) => {
  const { id } = req.params; // This ID is for the Registration document

  try {
    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration request not found.' });
    }
    if (registration.status !== 'pending') {
      return res.status(400).json({ message: 'Registration is not in pending status.' });
    }

    // 1. Create a new user from the approved registration data
    const newUser = await User.create({
      name: registration.name,
      email: registration.email,
      password: registration.password, // This is already hashed by Registration model's pre-save hook
      role: registration.role,
      department: registration.department,
      indexNumber: registration.indexNumber,
    });

    // 2. Delete the registration request after converting to a user
    await Registration.findByIdAndDelete(id);

    res.status(200).json({ message: `User ${newUser.email} approved and created successfully.` });

  } catch (error) {
    console.error('Error approving registration:', error);
    if (error.code === 11000) { // MongoDB duplicate key error (if a user with this email already exists)
      return res.status(400).json({ message: 'A user with this email already exists. Cannot approve duplicate.' });
    }
    res.status(500).json({ message: 'Server error during registration approval.', error: error.message });
  }
};

// @desc    Reject a registration request
// @route   DELETE /api/users/registrations/:id/reject
// @access  Private/Admin
const rejectRegistration = async (req, res) => {
  const { id } = req.params; // This ID is for the Registration document

  try {
    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration request not found.' });
    }
    if (registration.status !== 'pending') {
      return res.status(400).json({ message: 'Registration is not in pending status.' });
    }

    // Directly delete the pending registration request
    await Registration.findByIdAndDelete(id);

    res.status(200).json({ message: `Registration request for ${registration.email} rejected and removed.` });

  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ message: 'Server error during registration rejection.', error: error.message });
  }
};

// @desc    Update a user (existing, approved user)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, indexNumber, department } = req.body;

  try {
    const user = await User.findById(id);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      user.department = department || user.department;

      if (user.role === 'Student') {
        user.indexNumber = indexNumber || user.indexNumber;
      } else {
        user.indexNumber = undefined;
      }

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// @desc    Delete a user (existing, approved user)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);

    if (user) {
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Export all controller functions for use in routes
export { registerUser, authUser, getUsers, createUser, getPendingRegistrations, approveRegistration, rejectRegistration, updateUser, deleteUser };
