const express = require('express');
const router = express.Router();
const {
  getRoutePackages,
  getRoutePackageDetail,
  getRoutePackageOffers,
} = require('../controllers/routePackageController');

router.get('/', getRoutePackages);
router.get('/:id/offers', getRoutePackageOffers);
router.get('/:id', getRoutePackageDetail);

module.exports = router;
