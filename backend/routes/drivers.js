const express = require('express');
const router = express.Router();
const {
  createDriver,
  getVendorDrivers,
  updateDriver,
  deleteDriver,
  createBooking,
  getVendorBookings,
  assignDriverToBooking,
  addDriverRating,
  getVehicleDriverRatings,
} = require('../controllers/driverController');
const { protect, vendor } = require('../middleware/auth');

router.get('/vehicle/:vendorId', getVehicleDriverRatings);

router.post('/bookings', protect, createBooking);
router.post('/:id/ratings', protect, addDriverRating);

router.get('/', protect, vendor, getVendorDrivers);
router.post('/', protect, vendor, createDriver);
router.put('/:id', protect, vendor, updateDriver);
router.delete('/:id', protect, vendor, deleteDriver);

router.get('/bookings/vendor', protect, vendor, getVendorBookings);
router.patch('/bookings/:bookingId/assign-driver', protect, vendor, assignDriverToBooking);

module.exports = router;
