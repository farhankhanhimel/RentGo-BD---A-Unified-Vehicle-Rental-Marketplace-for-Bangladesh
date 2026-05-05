const express = require('express');
const router = express.Router();
const {
    createVehicleListing,
    getVendorVehicles,
    updateVehicleListing,
    deleteVehiclePhoto,
    deactivateVehicle,
    adminApproveVehicle,
    adminRejectVehicle,
    getPendingVehicles,
    getApprovedVehicles,
    getVehicleDetail,
    getVehiclePriceEstimate,
    getVehicleAvailability,
} = require('../controllers/vehicleController');
const { protect, admin, vendor } = require('../middleware/auth');
const { uploadVehiclePhotos } = require('../middleware/upload');

// Public routes (non-parameterized first)
router.get('/', getApprovedVehicles);

// Admin routes (non-parameterized)
router.get('/admin/pending', protect, admin, getPendingVehicles);

// Vendor routes (literal paths before parameterized /:id)
router.post('/create', protect, vendor, uploadVehiclePhotos, createVehicleListing);
router.get('/my', protect, vendor, getVendorVehicles);

// Public parameterized routes
router.get('/:id/detail', getVehicleDetail);
router.post('/:id/estimate', getVehiclePriceEstimate);
router.get('/:id/availability', getVehicleAvailability);

// Vendor parameterized routes
router.put('/:id', protect, vendor, uploadVehiclePhotos, updateVehicleListing);
router.delete('/:id/photos', protect, vendor, deleteVehiclePhoto);
router.patch('/:id/deactivate', protect, vendor, deactivateVehicle);

// Admin routes
router.patch('/:id/approve', protect, admin, adminApproveVehicle);
router.patch('/:id/reject', protect, admin, adminRejectVehicle);

module.exports = router;
