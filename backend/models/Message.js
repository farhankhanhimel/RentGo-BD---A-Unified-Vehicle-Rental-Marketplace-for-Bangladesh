const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Reference to booking/request context
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    routePackageBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoutePackageBooking',
      default: null,
    },
    intercityRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IntercityRequest',
      default: null,
    },
    // Message content
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Message type: text, offer, negotiation, etc.
    type: {
      type: String,
      enum: ['text', 'offer', 'negotiation', 'request', 'document'],
      default: 'text',
    },
    // Metadata for offers/negotiations
    metadata: {
      price: Number,
      offerDetails: String,
      attachmentUrl: String,
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Deleted by sender or recipient
    deletedBySender: {
      type: Boolean,
      default: false,
    },
    deletedByRecipient: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ routePackageBooking: 1 });
messageSchema.index({ intercityRequest: 1 });
messageSchema.index({ booking: 1 });

// Remove deleted messages
messageSchema.query.active = function() {
  return this.where({
    deletedBySender: false,
    deletedByRecipient: false,
  });
};

module.exports = mongoose.model('Message', messageSchema);
