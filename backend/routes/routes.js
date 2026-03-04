const express = require('express');
const router = express.Router();
const { estimateFare, getPopularRoutes, getCities, reverseGeocode } = require('../controllers/routeController');

// Public routes — no auth required
router.post('/estimate', estimateFare);
router.get('/popular', getPopularRoutes);
router.get('/cities', getCities);
router.post('/reverse-geocode', reverseGeocode);

module.exports = router;
