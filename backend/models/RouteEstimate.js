const mongoose = require('mongoose');

const routeEstimateSchema = new mongoose.Schema({
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  destination: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  distanceKm: {
    type: Number,
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
  },
  estimatedFares: [
    {
      vehicleType: String,
      minFare: Number,
      maxFare: Number,
      averageFare: Number,
      vendorCount: Number,
    },
  ],
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    },
  },
});

// TTL index — auto-delete expired cache entries
routeEstimateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
routeEstimateSchema.index({
  'pickupLocation.coordinates.lat': 1,
  'pickupLocation.coordinates.lng': 1,
  'destination.coordinates.lat': 1,
  'destination.coordinates.lng': 1,
});

module.exports = mongoose.model('RouteEstimate', routeEstimateSchema);
