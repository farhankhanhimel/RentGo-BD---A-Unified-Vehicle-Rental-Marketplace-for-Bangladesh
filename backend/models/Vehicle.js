const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  make: { type: String, required: true },
  model: { type: String, required: true },
  vehicleType: { type: String, required: true },
  dailyRate: { type: Number, required: true },
  transmission: { type: String, required: true },
  fuelType: { type: String, required: true },
  rentalMode: { type: String, required: true },
  operatingArea: { type: String, required: true },
  images: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);