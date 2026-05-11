const express = require('express');
const router = express.Router();
const { getAdvancedSearchResults } = require('../controllers/advancedSearchController');

router.get('/', getAdvancedSearchResults);

module.exports = router;