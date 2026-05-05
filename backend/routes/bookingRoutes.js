const express = require('express');
const router = express.Router();
const {
    createBooking,
    vendorRespondToBooking,
    updateBookingStatus,
    cancelBooking,
    getCustomerBookings,
    getVendorBookings,
    getBookingById,
} = require('../controllers/bookingController');
const { protect, vendor, customer } = require('../middleware/auth');

// Customer routes
router.post('/', protect, customer, createBooking);
router.get('/my', protect, customer, getCustomerBookings);

// Vendor routes
router.patch('/:id/respond', protect, vendor, vendorRespondToBooking);
router.patch('/:id/status', protect, vendor, updateBookingStatus);
router.get('/vendor', protect, vendor, getVendorBookings);

// Shared routes (customer or vendor)
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/pay', protect, customer, require('../controllers/bookingController').mockPayment);
router.get('/:id', protect, getBookingById);

module.exports = router;
