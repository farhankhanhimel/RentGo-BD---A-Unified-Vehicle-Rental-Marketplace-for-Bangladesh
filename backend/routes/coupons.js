const express = require('express');
const router = express.Router();
const { protect, vendor, customer, admin } = require('../middleware/auth');
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCouponCode,
  getAvailableCoupons,
} = require('../controllers/couponController');

// Customer routes
router.get('/available', protect, customer, getAvailableCoupons);
router.post('/validate', protect, validateCouponCode);

// Vendor/Admin routes
router.get('/', protect, getCoupons);
router.post('/', protect, createCoupon);
router.put('/:id', protect, updateCoupon);
router.delete('/:id', protect, deleteCoupon);
router.put('/:id/toggle', protect, toggleCoupon);

module.exports = router;
