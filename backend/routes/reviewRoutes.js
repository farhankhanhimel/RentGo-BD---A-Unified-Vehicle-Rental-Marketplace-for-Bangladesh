const express = require('express');
const router = express.Router();
const {
    submitReview,
    getVehicleReviews,
    checkReviewEligibility,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Public
router.get('/vehicle/:vehicleId', getVehicleReviews);

// Protected
router.post('/', protect, submitReview);
router.get('/can-review/:bookingId', protect, checkReviewEligibility);

module.exports = router;
