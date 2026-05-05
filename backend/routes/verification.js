const express = require('express');
const router = express.Router();
const { protect, admin, vendor } = require('../middleware/auth');
const {
  submitVerification,
  getVerificationStatus,
  getVerificationQueue,
  getVerificationDetail,
  approveVerification,
  rejectVerification,
  revokeVerification,
  getVerificationStats,
} = require('../controllers/verificationController');

/**
 * Verification Routes — Feature 22 (Tasfy)
 */

// Vendor routes
router.post('/submit', protect, vendor, submitVerification);
router.get('/status', protect, vendor, getVerificationStatus);

// Admin routes
router.get('/stats', protect, admin, getVerificationStats);
router.get('/queue', protect, admin, getVerificationQueue);
router.get('/:vendorId', protect, admin, getVerificationDetail);
router.put('/:vendorId/approve', protect, admin, approveVerification);
router.put('/:vendorId/reject', protect, admin, rejectVerification);
router.put('/:vendorId/revoke', protect, admin, revokeVerification);

module.exports = router;
