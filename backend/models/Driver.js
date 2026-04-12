const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const driverSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      required: [true, 'Driver photo URL is required'],
      trim: true,
    },
    nidNumber: {
      type: String,
      required: [true, 'NID is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    experienceYears: {
      type: Number,
      min: 0,
      required: [true, 'Driving experience is required'],
    },
    languages: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ratings: {
      type: [ratingSchema],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

driverSchema.methods.recalculateRating = function recalculateRating() {
  if (!this.ratings.length) {
    this.averageRating = 0;
    return;
  }

  const total = this.ratings.reduce((sum, item) => sum + item.score, 0);
  this.averageRating = Number((total / this.ratings.length).toFixed(2));
};

module.exports = mongoose.model('Driver', driverSchema);
