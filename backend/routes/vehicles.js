const express = require('express');
const router = express.Router();
const { searchAndFilterVehicles } = require('../controllers/vehicleController');

router.get('/search', searchAndFilterVehicles);

module.exports = router;