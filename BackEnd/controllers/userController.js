import User from '../models/User.js';
import bcrypt from 'bcryptjs'; // Password hashing සඳහා
import jwt from 'jsonwebtoken'; // JWT generation සඳහා

// JWT token generate කරන function එක
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token එකේ කල් ඉකුත් වන කාලය
  });
};

// @desc    Authenticate user & get token (User Login)
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists by email
    const user = await User.findOne({ email });

    if (!user) {
      // If user not found, return invalid credentials message
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Compare password (using bcrypt.compare for hashed passwords)
    // user.password is the hashed password from the database
    const isMatch = await bcrypt.compare(password, user.password); // <-- මෙය නිවැරදි ක්‍රමයයි

    if (!isMatch) {
      // If passwords don't match, return invalid credentials message
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. If credentials match, generate a token
    const token = generateToken(user._id);

    // 4. Send user data and token
    res.json({
      user: {
        _id: user._id, // MongoDB default ID is _id
        name: user.name,
        email: user.email,
        role: user.role,
        // You can include other necessary user details here (e.g., department, indexNumber for student)
      },
      token,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};


// @desc    Get all users
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

// @desc    Create a new user (e.g., after registration approval)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { name, email, password, role, indexNumber, department } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword, // Save hashed password
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
        message: 'User created successfully',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// @desc    Update a user
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
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        message: 'User updated successfully',
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

export { getUsers, createUser, updateUser, deleteUser, authUser }; // authUser export කරන්න
