const mongoose = require('mongoose');

/**
 * Event Package Model
 * Feature 17 — Tasfy
 * Allows vendors to create event-specific rental packages
 */
const eventPackageSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor is required'],
  },
  title: {
    type: String,
    required: [true, 'Package title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  eventType: {
    type: String,
    enum: ['wedding', 'corporate', 'tourism', 'airport_transfer', 'concert', 'festival', 'other'],
    required: [true, 'Event type is required'],
  },
  vehicles: [{
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    quantity: { type: Number, default: 1 },
    role: { type: String, trim: true }, // e.g., "Bride's car", "Guest shuttle"
  }],
  includes: [{
    type: String, // "Decorated vehicles", "Professional driver", "Fuel included"
  }],
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
    },
    pricePerAdditionalHour: { type: Number, default: 0 },
    pricePerAdditionalVehicle: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
  },
  duration: {
    hours: { type: Number, required: true },
    maxHours: { type: Number },
  },
  maxGuests: { type: Number },
  coverageArea: {
    cities: [{ type: String }],
    district: { type: String },
  },
  photos: [{
    type: String, // Cloudinary URLs
  }],
  availability: {
    daysOfWeek: [{
      type: Number, // 0-6, Sunday-Saturday
    }],
    blackoutDates: [{
      type: Date,
    }],
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  bookingsCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
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

eventPackageSchema.index({ vendor: 1 });
eventPackageSchema.index({ eventType: 1, isActive: 1, isApproved: 1 });
eventPackageSchema.index({ 'coverageArea.cities': 1 });
eventPackageSchema.index({ 'pricing.basePrice': 1 });

eventPackageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EventPackage', eventPackageSchema);
