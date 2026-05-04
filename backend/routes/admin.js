const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// User management
router.get('/users', protect, admin, adminController.listUsers);
router.patch('/users/:id', protect, admin, adminController.updateUser);
router.delete('/users/:id', protect, admin, adminController.deleteUser);

// Vendor approval
router.get('/vendors/pending', protect, admin, adminController.listPendingVendors);
router.patch('/vendors/:id/verify', protect, admin, adminController.verifyVendor);

// Disputes
router.get('/disputes', protect, admin, adminController.listDisputes);
router.patch('/disputes/:id', protect, admin, adminController.updateDispute);

// Config
router.get('/config', protect, admin, adminController.getConfig);
router.post('/config/commission', protect, admin, adminController.setConfig);

// Analytics
router.get('/analytics', protect, admin, adminController.analytics);

module.exports = router;
