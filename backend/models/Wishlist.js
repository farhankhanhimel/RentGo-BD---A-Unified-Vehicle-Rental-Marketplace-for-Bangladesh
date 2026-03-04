const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  priceAtSave: {
    type: Number,
    required: true,
  },
  notifyOnPriceDrop: {
    type: Boolean,
    default: true,
  },
  notifyOnAvailability: {
    type: Boolean,
    default: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate entries — one user can wishlist a vehicle only once
wishlistSchema.index({ user: 1, vehicle: 1 }, { unique: true });
wishlistSchema.index({ vehicle: 1 }); // For notification lookups

module.exports = mongoose.model('Wishlist', wishlistSchema);
