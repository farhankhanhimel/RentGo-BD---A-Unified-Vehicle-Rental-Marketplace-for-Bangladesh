const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    preferredVendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    vehicleName: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    pickupLocation: {
      type: String,
      default: '',
      trim: true,
    },
    withDriver: {
      type: Boolean,
      default: false,
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    pickupDate: {
      type: Date,
      required: [true, 'Pickup date is required'],
    },
    isEmergency: {
      type: Boolean,
      default: false,
      index: true,
    },
    emergencyStatus: {
      type: String,
      enum: ['queued', 'broadcast', 'claimed', 'escalated', 'resolved', 'cancelled'],
      default: 'queued',
      index: true,
    },
    emergencyNotes: {
      type: String,
      default: '',
      trim: true,
    },
    responseDueAt: {
      type: Date,
      default: null,
    },
    emergencyAlertSentAt: {
      type: Date,
      default: null,
    },
    emergencyNotifiedVendorIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    emergencyClaimedAt: {
      type: Date,
      default: null,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial_paid', 'paid', 'failed'],
      default: 'unpaid',
    },
    lastTransactionId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
