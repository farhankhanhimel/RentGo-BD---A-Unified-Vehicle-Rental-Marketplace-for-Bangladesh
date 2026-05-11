const express = require('express');
const router = express.Router();
const { validateCoupon } = require('../controllers/checkoutController');

router.post('/validate-coupon', validateCoupon);

module.exports = router;