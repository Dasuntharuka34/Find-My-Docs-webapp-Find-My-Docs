import User from '../models/User.js';
import Registration from '../models/Registration.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    Register a new user (Creates a pending registration request)
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, nic, password, role, department, indexNumber } = req.body; // Added nic

  try {
    // Check if user/registration exists by email or NIC
    const userExistsByEmail = await User.findOne({ email });
    const userExistsByNic = await User.findOne({ nic });
    const registrationPendingByEmail = await Registration.findOne({ email, status: 'pending' });
    const registrationPendingByNic = await Registration.findOne({ nic, status: 'pending' });

    if (userExistsByEmail) {
      return res.status(400).json({ message: 'User with this email is already registered.' });
    }
    if (userExistsByNic) {
      return res.status(400).json({ message: 'User with this NIC is already registered.' });
    }
    if (registrationPendingByEmail) {
      return res.status(400).json({ message: 'A registration request with this email is already pending admin approval.' });
    }
    if (registrationPendingByNic) {
      return res.status(400).json({ message: 'A registration request with this NIC is already pending admin approval.' });
    }

    // Create a new registration request in the Registration collection
    const registration = await Registration.create({
      name,
      email,
      nic, // Pass NIC to registration
      password, // Password will be hashed by the pre-save hook in Registration model
      role,
      department: department, // Department is now always saved if provided
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
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nic: user.nic, // Include NIC in the returned user object
        role: user.role,
        department: user.department, // Include department
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
  const { name, email, nic, password, role, indexNumber, department } = req.body; // Added nic

  try {
    const userExistsByEmail = await User.findOne({ email });
    const userExistsByNic = await User.findOne({ nic });
    if (userExistsByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    if (userExistsByNic) {
        return res.status(400).json({ message: 'User with this NIC already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      nic: nic, // Store NIC
      password: hashedPassword,
      role,
      indexNumber: role === 'Student' ? indexNumber : undefined,
      department: department, // Department is always saved if provided
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nic: user.nic, // Return NIC
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
  const { id } = req.params;

  try {
    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration request not found.' });
    }
    if (registration.status !== 'pending') {
      return res.status(400).json({ message: 'Registration is not in pending status.' });
    }

    // Check for duplicates in User collection before creating
    const userExistsByEmail = await User.findOne({ email: registration.email });
    const userExistsByNic = await User.findOne({ nic: registration.nic }); // Check by NIC too
    if (userExistsByEmail) {
      return res.status(400).json({ message: 'A user with this email already exists. Cannot approve duplicate.' });
    }
    if (userExistsByNic) {
        return res.status(400).json({ message: 'A user with this NIC already exists. Cannot approve duplicate.' });
    }


    const newUser = await User.create({
      name: registration.name,
      email: registration.email,
      nic: registration.nic, // Pass NIC from registration to user
      password: registration.password, // Already hashed
      role: registration.role,
      department: registration.department, // Department is always saved
      indexNumber: registration.indexNumber,
    });

    await Registration.findByIdAndDelete(id);

    res.status(200).json({ message: `User ${newUser.email} approved and created successfully.` });

  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ message: 'Server error during registration approval.', error: error.message });
  }
};

// @desc    Reject a registration request
// @route   DELETE /api/users/registrations/:id/reject
// @access  Private/Admin
const rejectRegistration = async (req, res) => {
  const { id } = req.params;

  try {
    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration request not found.' });
    }
    if (registration.status !== 'pending') {
      return res.status(400).json({ message: 'Registration is not in pending status.' });
    }

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
  const { name, email, nic, role, indexNumber, department } = req.body; // Added nic

  try {
    const user = await User.findById(id);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.nic = nic || user.nic; // Update NIC
      user.role = role || user.role;
      user.department = department || user.department; // Update department

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
  }
  catch (error) {
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
