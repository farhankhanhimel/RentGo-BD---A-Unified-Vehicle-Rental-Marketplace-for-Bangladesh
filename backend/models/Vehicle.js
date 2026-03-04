const mongoose = require('mongoose');

// Vehicle model - Foundation for vehicle listings
// Primary owner: Homyra (Feature 2 — Vehicle Listings)
// Used by: Tasfy's Features 6, 7, 12, 13, 17
const vehicleSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor is required'],
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
  },
  vehicleType: {
    type: String,
    enum: ['car', 'motorcycle', 'microbus', 'van', 'pickup', 'bus'],
    required: [true, 'Vehicle type is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  photos: [{
    type: String, // Cloudinary URLs
  }],
  features: {
    seats: { type: Number },
    ac: { type: Boolean, default: false },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'cng', 'octane', 'electric', 'hybrid'],
    },
    transmission: {
      type: String,
      enum: ['automatic', 'manual'],
    },
    engineCC: { type: Number },
    mileage: { type: String },
  },
  registration: {
    number: { type: String },
    document: { type: String }, // Cloudinary URL
  },
  pricing: {
    hourlyRate: { type: Number },
    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
    },
    weeklyRate: { type: Number },
    driverSurcharge: { type: Number, default: 0 },
    fuelPolicy: {
      type: String,
      enum: ['included', 'excluded'],
      default: 'excluded',
    },
  },
  location: {
    address: { type: String },
    city: { type: String, required: [true, 'City is required'] },
    district: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  rentalMode: {
    type: String,
    enum: ['self_drive', 'with_driver', 'both'],
    default: 'both',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
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

vehicleSchema.index({ vehicleType: 1, 'location.city': 1 });
vehicleSchema.index({ vendor: 1 });
vehicleSchema.index({ isAvailable: 1, isApproved: 1 });
vehicleSchema.index({ 'pricing.dailyRate': 1 });

vehicleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
