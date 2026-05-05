const express = require('express');
const router = express.Router();
const {
  getCustomerBookingsForPayment,
  initiatePayment,
  retryPayment,
  getTransactionReceipt,
  paymentSuccessCallback,
  paymentFailCallback,
  paymentCancelCallback,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/bookings', protect, getCustomerBookingsForPayment);
router.post('/initiate', protect, initiatePayment);
router.post('/retry/:transactionId', protect, retryPayment);
router.get('/receipt/:transactionId', protect, getTransactionReceipt);

router.post('/success', paymentSuccessCallback);
router.get('/success', paymentSuccessCallback);
router.post('/fail', paymentFailCallback);
router.get('/fail', paymentFailCallback);
router.post('/cancel', paymentCancelCallback);
router.get('/cancel', paymentCancelCallback);

module.exports = router;
