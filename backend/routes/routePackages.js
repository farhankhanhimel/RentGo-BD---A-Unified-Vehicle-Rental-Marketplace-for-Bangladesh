const express = require('express');
const router = express.Router();
const {
  createRoutePackage,
  getRoutePackages,
  getRoutePackageDetail,
  getRoutePackageOffers,
  getMyRoutePackages,
  updateRoutePackage,
  deleteRoutePackage,
  bookRoutePackage,
  getMyRoutePackageBookings,
  getVendorRoutePackageBookings,
  getRoutePackageBookingDetail,
  confirmRoutePackageBooking,
  cancelRoutePackageBooking,
} = require('../controllers/routePackageController');
const { protect, vendor, customer } = require('../middleware/auth');

// Customer booking endpoints
router.post('/bookings/create', protect, customer, bookRoutePackage);
router.get('/bookings/my', protect, customer, getMyRoutePackageBookings);
router.get('/bookings/:bookingId', protect, getRoutePackageBookingDetail);
router.put('/bookings/:bookingId/cancel', protect, cancelRoutePackageBooking);

// Vendor booking endpoints
router.get('/vendor/bookings', protect, vendor, getVendorRoutePackageBookings);
router.put('/bookings/:bookingId/confirm', protect, vendor, confirmRoutePackageBooking);

// Package management endpoints
router.get('/vendor/my-packages', protect, vendor, getMyRoutePackages);
router.post('/', protect, vendor, createRoutePackage);
router.put('/:id', protect, vendor, updateRoutePackage);
router.delete('/:id', protect, vendor, deleteRoutePackage);

// Public endpoints
router.get('/', getRoutePackages);
router.get('/:id/offers', getRoutePackageOffers);
router.get('/:id', getRoutePackageDetail);

module.exports = router;
