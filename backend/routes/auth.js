const express = require('express');
const router = express.Router();
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
} = require('../controllers/authController');
const { protect, admin, vendor, verifyActive } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, uploadAvatar);
router.post('/change-password', protect, changePassword);

// Address management routes
router.post('/add-address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.get('/addresses', protect, getAddresses);

module.exports = router;
