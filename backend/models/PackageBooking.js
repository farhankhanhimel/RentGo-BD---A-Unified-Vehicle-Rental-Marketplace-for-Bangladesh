const mongoose = require('mongoose');

/**
 * Package Booking Model
 * Feature 17 — Tasfy
 * Tracks bookings for event packages
 */
const packageBookingSchema = new mongoose.Schema({
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventPackage',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: String,
    unique: true,
  },
  eventDetails: {
    eventDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    location: { type: String, required: true },
    guestCount: { type: Number },
    specialRequests: { type: String },
  },
  pricing: {
    packagePrice: { type: Number, required: true },
    additionalCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    depositPaid: { type: Boolean, default: false },
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'declined'],
    default: 'pending',
  },
  contactInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
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

packageBookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingId = `EP-${dateStr}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

packageBookingSchema.index({ package: 1 });
packageBookingSchema.index({ customer: 1 });
packageBookingSchema.index({ vendor: 1 });
packageBookingSchema.index({ 'eventDetails.eventDate': 1 });

module.exports = mongoose.model('PackageBooking', packageBookingSchema);
