const mongoose = require('mongoose');

// Booking model - Foundation for booking system
// Primary owner: Sprint 2 team
// Used by: Tasfy's Features 12, 13, 18
const generateBookingId = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RG-${dateStr}-${random}`;
};

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true,
    default: generateBookingId,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor is required'],
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
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
    startDate: { type: Date },
    endDate: { type: Date },
    tripType: {
      type: String,
      enum: ['tourism', 'airport', 'wedding', 'office', 'emergency', 'other'],
      default: 'other',
    },
    withDriver: { type: Boolean, default: false },
    specialNotes: { type: String, default: '' },
  },
  pricing: {
    baseRate: { type: Number, required: true },
    driverFee: { type: Number, default: 0 },
    fuelCharge: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    couponCode: { type: String },
    totalAmount: { type: Number, required: true },
    advanceAmount: { type: Number, default: 0 },
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
      'payment_awaited',
      'pending_vendor_approval',
      'vendor_approved',
      'ongoing',
      'completed',
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
    enum: ['pending', 'partial', 'partial_paid', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  transactionId: String,
  lastTransactionId: { type: String, default: '' },
  invoiceUrl: String,
  expiresAt: { type: Date },
  cancelledBy: { type: String, default: '' },
  vendorDeclineReason: { type: String, default: '' },
  isEmergency: { type: Boolean, default: false },
  emergencyStatus: {
    type: String,
    enum: ['queued', 'broadcast', 'claimed', 'escalated'],
    default: 'queued',
  },
  emergencyNotes: { type: String, default: '' },
  emergencyAlertSentAt: { type: Date },
  emergencyClaimedAt: { type: Date },
  responseDueAt: { type: Date },
  emergencyNotifiedVendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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

// Ensure bookingId exists before validation runs
bookingSchema.pre('validate', function (next) {
  if (!this.bookingId) {
    this.bookingId = generateBookingId();
  }
  next();
});

bookingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ vendor: 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
