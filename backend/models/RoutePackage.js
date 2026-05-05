const mongoose = require('mongoose');

const routePackageSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    routeName: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    priceMin: { type: Number, required: true },
    priceMax: { type: Number, required: true },
    recommendedVehicleTypes: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    pickupPoints: { type: [String], default: [] },
    dropPoints: { type: [String], default: [] },
    durationDays: { type: Number, default: 1 },
    maxPassengers: { type: Number, default: 4 },
    withDriver: { type: Boolean, default: true },
    returnTripAvailable: { type: Boolean, default: false },
    fuelIncluded: { type: Boolean, default: false },
    bookingsCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

routePackageSchema.index({ vendor: 1, active: 1 });
routePackageSchema.index({ origin: 1, destination: 1 });
routePackageSchema.index({ vehicle: 1 });

module.exports = mongoose.model('RoutePackage', routePackageSchema);
