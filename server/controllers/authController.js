const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateUniqueUserId } = require('../utils/generateId');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, sponsorId } = req.body;

    // Validation
    if (!fullName || !email || !password || !sponsorId) {
      return res.status(400).json({ message: 'Please add all required fields, including Sponsor ID' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    let sponsor = null;
    // Validate Sponsor (Required)
    const searchSponsorId = sponsorId.trim().toUpperCase();
    const sponsorUser = await User.findOne({ userId: searchSponsorId });
    if (!sponsorUser) {
      return res.status(400).json({ message: 'Invalid Sponsor ID. A valid Sponsor ID is required to register.' });
    }
    sponsor = sponsorUser._id;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate CTC User ID
    const newUserId = await generateUniqueUserId();

    // Create user
    const user = await User.create({
      userId: newUserId,
      fullName,
      email,
      password: hashedPassword,
      plainPassword: password,
      sponsorId: searchSponsorId,
      sponsor: sponsor,
      level: sponsorUser ? (sponsorUser.level || 0) + 1 : 0,
    });

    if (user) {
      // Send Welcome Email
      await sendWelcomeEmail(user.email, user.fullName, user.userId, password);

      if (sponsor) {
        // Update direct sponsor
        await User.findByIdAndUpdate(sponsor, { $inc: { directTeam: 1, totalTeam: 1 } });

        // Traverse up the tree to update totalTeam for all ancestors
        let currentSponsorObj = await User.findById(sponsor);
        let currentSponsorId = currentSponsorObj ? currentSponsorObj.sponsor : null;
        let levelsChecked = 1;

        while (currentSponsorId && levelsChecked < 30) {
          const ancestor = await User.findByIdAndUpdate(currentSponsorId, { $inc: { totalTeam: 1 } });
          currentSponsorId = ancestor ? ancestor.sponsor : null;
          levelsChecked++;
        }
      }

      res.status(201).json({
        _id: user.id,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public


const loginUser = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    console.log('Login Attempt:', { userId, password });

    const searchId = userId.trim().toUpperCase();
    // Check for user ID (case-insensitive match)
    const user = await User.findOne({ userId: searchId });
    console.log('User found in DB:', user ? user.userId : 'No user found');

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check if user is blocked
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      }

      // Block admin accounts from logging into the user dashboard
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin accounts cannot log in here. Please use the Admin Panel.' });
      }

      res.json({
        _id: user.id,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isKYCVerified: user.isKYCVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
};



// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Forgot Password - Send Email Link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const origin = req.get('origin') || 'http://localhost:5173';
    const resetUrl = `${origin}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, user.fullName, resetUrl);

    res.status(200).json({ message: 'Password reset link has been sent to your email.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password - Set New Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.plainPassword = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
};
