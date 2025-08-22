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
  const { name, email, nic, password, role, department, indexNumber } = req.body;

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
      nic,
      password, // Password will be hashed by the pre-save hook in Registration model
      role,
      department: department,
      indexNumber: role === 'Student' ? indexNumber : undefined,
      profilePicture: null, // Default profile picture for new registrations
      status: 'pending',
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
        nic: user.nic,
        role: user.role,
        department: user.department,
        indexNumber: user.indexNumber,
        profilePicture: user.profilePicture, // Include profilePicture in the returned user object
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
  const { name, email, nic, password, role, indexNumber, department } = req.body;

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
      nic: nic,
      password: hashedPassword,
      role,
      indexNumber: role === 'Student' ? indexNumber : undefined,
      department: department,
      profilePicture: null, // Default profile picture for newly created users
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nic: user.nic,
        role: user.role,
        profilePicture: user.profilePicture,
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
    const userExistsByNic = await User.findOne({ nic: registration.nic });
    if (userExistsByEmail) {
      return res.status(400).json({ message: 'A user with this email already exists. Cannot approve duplicate.' });
    }
    if (userExistsByNic) {
        return res.status(400).json({ message: 'A user with this NIC already exists. Cannot approve duplicate.' });
    }


    const newUser = await User.create({
      name: registration.name,
      email: registration.email,
      nic: registration.nic,
      password: registration.password, // Already hashed
      role: registration.role,
      department: registration.department,
      indexNumber: registration.indexNumber,
      profilePicture: registration.profilePicture,
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

// @desc    Update a user profile
// @route   PUT /api/users/:id
// @access  Private/User (Protected by auth middleware)
const updateUser = async (req, res) => {
  // --- DEBUGGING LOGS ---
  console.log('--- Inside updateUser controller ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);
  console.log('req.params.id:', req.params.id);
  // --- END DEBUGGING LOGS ---

  const { id } = req.params;
  // Make sure to access req.body properties safely, as they might be undefined if FormData is empty
  const name = req.body.name;
  const email = req.body.email;
  const nic = req.body.nic;
  const department = req.body.department;
  const indexNumber = req.body.indexNumber;
  const role = req.body.role; // Get role from req.body as it's sent from frontend edit form

  const profilePicturePath = req.file ? `/uploads/profile_pictures/${req.file.filename}` : null;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if new email/NIC already exists for another user (excluding current user)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) { // Ensure it's not the current user's own email
        return res.status(400).json({ message: 'Email already in use by another account.' });
      }
    }
    if (nic && nic !== user.nic) {
      const nicExists = await User.findOne({ nic });
      if (nicExists && nicExists._id.toString() !== user._id.toString()) { // Ensure it's not the current user's own NIC
        return res.status(400).json({ message: 'NIC already in use by another account.' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.nic = nic || user.nic;
    user.department = department || user.department;
    // Role should not be updated by user, only admin can change roles
    // user.role = role || user.role; // Keep original role, or only admin updates this

    // Update indexNumber only if the user's role is Student based on original role
    // Or based on the role submitted from the form if the role field is meant to be sent (but it's disabled in frontend)
    if (user.role === 'Student') { // Use user.role from DB for this logic, not necessarily req.body.role
      user.indexNumber = indexNumber || user.indexNumber;
    } else {
      user.indexNumber = undefined;
    }

    // Update profile picture only if a new file was uploaded
    if (profilePicturePath) {
      user.profilePicture = profilePicturePath;
    } else if (req.body.removeProfilePicture === 'true') { // Example for removing
      user.profilePicture = null;
    }


    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      nic: updatedUser.nic,
      role: updatedUser.role,
      department: updatedUser.department,
      indexNumber: updatedUser.indexNumber,
      profilePicture: updatedUser.profilePicture,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
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

export { registerUser, authUser, getUsers, createUser, getPendingRegistrations, approveRegistration, rejectRegistration, updateUser, deleteUser };
