const express = require('express');
const router = express.Router();
const { protect, customer } = require('../middleware/auth');
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  updatePreferences,
} = require('../controllers/wishlistController');

// All wishlist routes require authentication and customer role
router.use(protect, customer);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.get('/check/:vehicleId', checkWishlist);

router.route('/:vehicleId')
  .delete(removeFromWishlist);

router.put('/:vehicleId/preferences', updatePreferences);

module.exports = router;
