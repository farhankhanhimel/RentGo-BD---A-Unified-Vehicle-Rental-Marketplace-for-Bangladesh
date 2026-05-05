const express = require('express');
const router = express.Router();
const { protect, vendor, admin } = require('../middleware/auth');
const {
	getVehicles,
	getVehicle,
	getVendorVehicles,
	updateVehicle,
	getPendingVehicles,
	adminApproveVehicle,
	adminRejectVehicle,
} = require('../controllers/vehicleController');

// Public routes
router.get('/', getVehicles);
router.get('/admin/pending', protect, admin, getPendingVehicles);
router.get('/my', protect, vendor, getVendorVehicles);
router.get('/:id', getVehicle);

// Vendor-only route — triggers wishlist notifications on price/availability changes
router.put('/:id', protect, vendor, updateVehicle);
router.patch('/:id/approve', protect, admin, adminApproveVehicle);
router.patch('/:id/reject', protect, admin, adminRejectVehicle);

module.exports = router;
