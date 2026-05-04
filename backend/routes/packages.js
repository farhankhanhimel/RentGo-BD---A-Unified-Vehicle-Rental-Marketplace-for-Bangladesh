const express = require('express');
const router = express.Router();
const { getPackages, getPackageOffers } = require('../controllers/packageController');

// Public: list packages
router.get('/', getPackages);

// Public: get offers for a package
router.get('/:id/offers', getPackageOffers);

module.exports = router;
