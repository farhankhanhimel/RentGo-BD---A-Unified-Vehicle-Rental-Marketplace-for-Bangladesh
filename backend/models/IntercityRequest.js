const mongoose = require('mongoose');

const intercityOfferSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    routePackage: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutePackage' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    price: { type: Number, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'withdrawn'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const intercityMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

const intercityRequestSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    pickupPoint: { type: String, default: '', trim: true },
    dropPoint: { type: String, default: '', trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    passengers: { type: Number, default: 1 },
    vehicleType: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    withDriver: { type: Boolean, default: true },
    returnTrip: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'negotiating', 'accepted', 'cancelled', 'expired'],
      default: 'open',
    },
    acceptedOffer: { type: mongoose.Schema.Types.ObjectId },
    acceptedVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    offers: [intercityOfferSchema],
    messages: [intercityMessageSchema],
  },
  { timestamps: true }
);

intercityRequestSchema.index({ status: 1, origin: 1, destination: 1 });
intercityRequestSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('IntercityRequest', intercityRequestSchema);
