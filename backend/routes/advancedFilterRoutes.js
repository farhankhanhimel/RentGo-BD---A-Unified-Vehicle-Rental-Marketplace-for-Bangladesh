const express = require('express');
const router = express.Router();
const { getAdvancedFilters } = require('../controllers/advancedFilterController');

router.get('/search', getAdvancedFilters);

module.exports = router;