const express = require('express');
const router = express.Router();
const { getComparisonData } = require('../controllers/vendorCompareController');

router.post('/', getComparisonData);

module.exports = router;