const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);