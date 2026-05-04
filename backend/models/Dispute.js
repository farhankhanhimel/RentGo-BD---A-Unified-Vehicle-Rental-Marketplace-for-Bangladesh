const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    status: { type: String, enum: ['open', 'under_review', 'resolved', 'rejected'], default: 'open' },
    resolutionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);
