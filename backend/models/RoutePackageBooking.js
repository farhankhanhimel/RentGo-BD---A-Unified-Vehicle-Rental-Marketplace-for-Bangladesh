const mongoose = require('mongoose');

/**
 * Route Package Booking Model
 * Tracks bookings for route packages
 */
const routePackageBookingSchema = new mongoose.Schema({
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoutePackage',
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
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  travelDate: {
    type: Date,
    required: true,
  },
  passengers: {
    type: Number,
    required: true,
    default: 1,
  },
  specialRequests: {
    type: String,
    default: '',
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

routePackageBookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingId = `RP-${dateStr}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

routePackageBookingSchema.index({ package: 1 });
routePackageBookingSchema.index({ customer: 1 });
routePackageBookingSchema.index({ vendor: 1 });
routePackageBookingSchema.index({ 'bookingDate': 1 });
routePackageBookingSchema.index({ 'travelDate': 1 });

module.exports = mongoose.model('RoutePackageBooking', routePackageBookingSchema);