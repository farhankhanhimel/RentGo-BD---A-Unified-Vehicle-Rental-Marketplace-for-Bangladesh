const mongoose = require('mongoose');

// Booking model - Foundation for booking system
// Primary owner: Sprint 2 team
// Used by: Tasfy's Features 12, 13, 18
const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor is required'],
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  bookingMode: {
    type: String,
    enum: ['instant', 'request'],
    default: 'instant',
  },
  tripDetails: {
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String },
    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    tripType: {
      type: String,
      enum: ['tourism', 'airport', 'wedding', 'office', 'emergency', 'other'],
      default: 'other',
    },
  },
  pricing: {
    baseRate: { type: Number, required: true },
    driverFee: { type: Number, default: 0 },
    fuelCharge: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    couponCode: { type: String },
    totalAmount: { type: Number, required: true },
    advancePaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'vehicle_handed_over',
      'trip_started',
      'trip_completed',
      'cancelled',
      'declined',
      'expired',
    ],
    default: 'pending',
  },
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  vendorResponse: {
    action: {
      type: String,
      enum: ['approved', 'declined'],
    },
    reason: String,
    respondedAt: Date,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
  transactionId: String,
  invoiceUrl: String,
  cancellationPolicy: {
    type: String,
    default: 'Free cancellation up to 24 hours before pickup. 50% refund for cancellation within 24 hours. No refund for no-show.',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate booking ID before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingId = `RG-${dateStr}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ vendor: 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
