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
} = require('../controllers/routePackageController');
const { protect, vendor } = require('../middleware/auth');

router.get('/vendor/my-packages', protect, vendor, getMyRoutePackages);
router.post('/', protect, vendor, createRoutePackage);
router.put('/:id', protect, vendor, updateRoutePackage);
router.delete('/:id', protect, vendor, deleteRoutePackage);
router.get('/', getRoutePackages);
router.get('/:id/offers', getRoutePackageOffers);
router.get('/:id', getRoutePackageDetail);

module.exports = router;
