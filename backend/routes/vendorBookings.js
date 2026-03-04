const express = require('express');
const router = express.Router();
const { protect, vendor } = require('../middleware/auth');
const {
  getVendorBookings,
  getBookingDetail,
  updateBookingStatus,
  updatePaymentStatus,
  getVendorStats,
  exportBookings,
  getCalendarBookings,
  respondToBooking,
} = require('../controllers/vendorBookingController');

// All routes require vendor auth
router.use(protect, vendor);

// Stats & exports (placed before :id to avoid conflicts)
router.get('/stats', getVendorStats);
router.get('/export', exportBookings);
router.get('/calendar', getCalendarBookings);

// CRUD
router.get('/', getVendorBookings);
router.get('/:id', getBookingDetail);
router.put('/:id/status', updateBookingStatus);
router.put('/:id/respond', respondToBooking);
router.put('/:id/payment', updatePaymentStatus);

module.exports = router;
