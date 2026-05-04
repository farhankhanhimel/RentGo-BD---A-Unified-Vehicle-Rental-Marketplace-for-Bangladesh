const mongoose = require('mongoose');

const routePackageSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    priceMin: { type: Number, required: true },
    priceMax: { type: Number, required: true },
    recommendedVehicleTypes: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RoutePackage', routePackageSchema);
