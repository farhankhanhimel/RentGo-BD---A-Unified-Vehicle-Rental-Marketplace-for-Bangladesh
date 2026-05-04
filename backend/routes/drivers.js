const express = require('express');
const router = express.Router();
const {
  createDriver,
  getVendorDrivers,
  updateDriver,
  deleteDriver,
  createBooking,
  getCustomerBookings,
  getVendorBookings,
  getEmergencyBookingsForVendor,
  getEmergencyBookingsForAdmin,
  claimEmergencyBooking,
  assignDriverToBooking,
  addDriverRating,
  getVehicleDriverRatings,
} = require('../controllers/driverController');
const { protect, vendor, admin } = require('../middleware/auth');

router.get('/vehicle/:vendorId', getVehicleDriverRatings);

router.post('/bookings', protect, createBooking);
router.get('/bookings/customer', protect, getCustomerBookings);
router.get('/bookings/emergency', protect, vendor, getEmergencyBookingsForVendor);
router.get('/bookings/emergency/admin', protect, admin, getEmergencyBookingsForAdmin);
router.patch('/bookings/:bookingId/claim-emergency', protect, vendor, claimEmergencyBooking);
router.post('/:id/ratings', protect, addDriverRating);

router.get('/', protect, vendor, getVendorDrivers);
router.post('/', protect, vendor, createDriver);
router.put('/:id', protect, vendor, updateDriver);
router.delete('/:id', protect, vendor, deleteDriver);

router.get('/bookings/vendor', protect, vendor, getVendorBookings);
router.patch('/bookings/:bookingId/assign-driver', protect, vendor, assignDriverToBooking);

module.exports = router;
