const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  downloadInvoice,
  viewInvoice,
  getInvoiceData,
} = require('../controllers/invoiceController');

// All routes require authentication
router.use(protect);

router.get('/:bookingId', getInvoiceData);
router.get('/:bookingId/download', downloadInvoice);
router.get('/:bookingId/view', viewInvoice);

module.exports = router;
