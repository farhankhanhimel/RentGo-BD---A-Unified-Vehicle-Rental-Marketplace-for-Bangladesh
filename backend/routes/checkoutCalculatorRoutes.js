const express = require('express');
const router = express.Router();
const { calculateTotalCost } = require('../controllers/checkoutCalculatorController');

router.post('/calculate', calculateTotalCost);

module.exports = router;