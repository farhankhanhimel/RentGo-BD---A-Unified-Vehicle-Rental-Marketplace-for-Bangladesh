const express = require('express');
const router = express.Router();
const { protect, customer, vendor } = require('../middleware/auth');
const {
  createIntercityRequest,
  getMyIntercityRequests,
  getVendorIntercityRequests,
  createVendorOffer,
  acceptVendorOffer,
  addIntercityMessage,
} = require('../controllers/intercityRequestController');

router.post('/', protect, customer, createIntercityRequest);
router.get('/my', protect, customer, getMyIntercityRequests);
router.get('/vendor/open', protect, vendor, getVendorIntercityRequests);
router.post('/:id/offers', protect, vendor, createVendorOffer);
router.post('/:id/offers/:offerId/accept', protect, customer, acceptVendorOffer);
router.post('/:id/messages', protect, addIntercityMessage);

module.exports = router;
