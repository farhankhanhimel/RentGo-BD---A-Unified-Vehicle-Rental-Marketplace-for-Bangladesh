const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gateway: {
      type: String,
      default: 'sslcommerz',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['full', 'advance'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    advancePercent: {
      type: Number,
      default: 0,
    },
    dueAfterPayment: {
      type: Number,
      default: 0,
    },
    sessionKey: {
      type: String,
      default: '',
    },
    gatewayUrl: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: '',
    },
    bankTransactionId: {
      type: String,
      default: '',
    },
    valId: {
      type: String,
      default: '',
    },
    receipt: {
      receiptNo: {
        type: String,
        default: '',
      },
      issuedAt: {
        type: Date,
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    retryOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
      default: null,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
