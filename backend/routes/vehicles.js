const express = require('express');
const router = express.Router();
const { protect, vendor } = require('../middleware/auth');
const { getVehicles, getVehicle, updateVehicle } = require('../controllers/vehicleController');

// Public routes
router.get('/', getVehicles);
router.get('/:id', getVehicle);

// Vendor-only route — triggers wishlist notifications on price/availability changes
router.put('/:id', protect, vendor, updateVehicle);

module.exports = router;
