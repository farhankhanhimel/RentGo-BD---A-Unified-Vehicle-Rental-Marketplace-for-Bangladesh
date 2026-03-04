const express = require('express');
const router = express.Router();
const { protect, vendor, customer } = require('../middleware/auth');
const {
  createPackage,
  getPackages,
  getPackageDetail,
  getMyPackages,
  updatePackage,
  deletePackage,
  bookPackage,
  getPackageBookings,
  updatePackageBookingStatus,
} = require('../controllers/eventPackageController');

// Public routes
router.get('/', getPackages);
router.get('/:id', getPackageDetail);

// Vendor routes (placed before customer to avoid conflicts)
router.get('/vendor/my-packages', protect, vendor, getMyPackages);
router.get('/vendor/bookings', protect, vendor, getPackageBookings);
router.post('/', protect, vendor, createPackage);
router.put('/:id', protect, vendor, updatePackage);
router.delete('/:id', protect, deletePackage);
router.put('/bookings/:id/status', protect, vendor, updatePackageBookingStatus);

// Customer routes
router.post('/:id/book', protect, customer, bookPackage);

module.exports = router;
