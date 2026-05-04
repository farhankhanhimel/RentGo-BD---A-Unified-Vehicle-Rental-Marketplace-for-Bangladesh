const express = require('express');
const router = express.Router();
const {
    getVendorEarnings,
    exportEarningsCSV,
    exportEarningsPDF,
} = require('../controllers/earningsController');
const { protect, vendor } = require('../middleware/auth');

router.get('/', protect, vendor, getVendorEarnings);
router.get('/export/csv', protect, vendor, exportEarningsCSV);
router.get('/export/pdf', protect, vendor, exportEarningsPDF);

module.exports = router;
