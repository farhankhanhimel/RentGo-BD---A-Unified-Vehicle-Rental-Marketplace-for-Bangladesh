const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../services/twilioService');
const { uploadImage } = require('../services/cloudinaryService');
const validator = require('validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register new user (Customer or Vendor)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, role, vendorDetails } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email or phone already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'customer',
    });

    // If vendor, add vendor details
    if (role === 'vendor' && vendorDetails) {
      user.vendorDetails = {
        businessName: vendorDetails.businessName,
        businessType: vendorDetails.businessType,
        businessAddress: vendorDetails.businessAddress,
        companyRegistration: vendorDetails.companyRegistration,
      };
    }

    // Generate and send OTP
    const otp = user.generateOTP();
    await user.save();

    try {
      await sendOTP(phone, otp);
    } catch (error) {
      console.error('OTP sending failed:', error);
      // Continue anyway but notify user
    }

    res.status(201).json({
      message: 'User registered successfully. Please verify your phone number.',
      userId: user._id,
      phone: user.phone,
      requiresOTP: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verifyOTP(otp)) {
      user.isActive = true;
      await user.save();
      
      res.json({
        message: 'Phone verified successfully',
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } else {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = user.generateOTP();
    await user.save();

    try {
      await sendOTP(user.phone, otp);
    } catch (error) {
      console.error('OTP sending failed:', error);
    }

    res.json({ message: 'OTP sent to your phone' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account not verified. Please verify your phone number.',
        userId: user._id,
      });
    }

    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: user._id } });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
      user.phone = phone;
      user.isPhoneVerified = false;
    }
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const user = await User.findById(req.user._id);
    
    // Upload to Cloudinary
    const imageUrl = await uploadImage(req.file.path, 'rentgo/avatars');
    
    user.avatar = imageUrl;
    await user.save();
    
    res.json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await user.changePassword(oldPassword, newPassword);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add saved address
// @route   POST /api/auth/add-address
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { label, address, city, zipCode, isDefault } = req.body;

    if (!label || !address || !city || !zipCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.user._id);
    
    if (isDefault) {
      user.savedAddresses.forEach(addr => addr.isDefault = false);
    }

    user.savedAddresses.push({
      label,
      address,
      city,
      zipCode,
      isDefault: isDefault || user.savedAddresses.length === 0,
    });

    await user.save();

    res.status(201).json({
      message: 'Address added successfully',
      addresses: user.savedAddresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update saved address
// @route   PUT /api/auth/address/:addressId
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, address, city, zipCode, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    const addressIndex = user.savedAddresses.findIndex(a => a._id.toString() === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (label) user.savedAddresses[addressIndex].label = label;
    if (address) user.savedAddresses[addressIndex].address = address;
    if (city) user.savedAddresses[addressIndex].city = city;
    if (zipCode) user.savedAddresses[addressIndex].zipCode = zipCode;

    if (isDefault) {
      user.savedAddresses.forEach((addr, idx) => {
        addr.isDefault = idx === addressIndex;
      });
    }

    await user.save();

    res.json({
      message: 'Address updated successfully',
      addresses: user.savedAddresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete saved address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.user._id);
    user.savedAddresses = user.savedAddresses.filter(a => a._id.toString() !== addressId);

    await user.save();

    res.json({
      message: 'Address deleted successfully',
      addresses: user.savedAddresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user addresses
// @route   GET /api/auth/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.savedAddresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
