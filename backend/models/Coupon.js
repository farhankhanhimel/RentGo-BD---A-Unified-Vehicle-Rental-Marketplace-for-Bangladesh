const mongoose = require('mongoose');

/**
 * Coupon Model
 * Feature 18 — Tasfy
 */
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount must be positive'],
  },
  maxDiscount: {
    type: Number,
    default: null, // For percentage: max ৳ cap
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  applicableVehicleTypes: [{
    type: String,
    enum: ['car', 'motorcycle', 'microbus', 'van', 'pickup', 'bus'],
  }],
  applicableTripTypes: [{
    type: String,
    enum: ['tourism', 'airport', 'wedding', 'office', 'emergency', 'other'],
  }],
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = platform-wide coupon (admin only)
  },
  usageLimit: {
    type: Number,
    default: null, // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  perUserLimit: {
    type: Number,
    default: 1,
  },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    bookingId: String,
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

couponSchema.index({ vendor: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

couponSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Coupon', couponSchema);
