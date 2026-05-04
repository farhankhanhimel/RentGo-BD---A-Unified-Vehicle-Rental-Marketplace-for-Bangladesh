const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reviewType: {
        type: String,
        enum: ['customer_reviews_vehicle', 'vendor_reviews_customer'],
        required: true,
    },
    // Customer reviewing the vehicle/vendor
    vehicleRating: {
        condition: { type: Number, min: 1, max: 5 },
        cleanliness: { type: Number, min: 1, max: 5 },
        driverBehaviour: { type: Number, min: 1, max: 5 },
        valueMoney: { type: Number, min: 1, max: 5 },
        overall: { type: Number, min: 1, max: 5 },
    },
    // Vendor reviewing the customer
    customerRating: {
        punctuality: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        vehicleCare: { type: Number, min: 1, max: 5 },
        overall: { type: Number, min: 1, max: 5 },
    },
    comment: { type: String, maxlength: 1000 },
    status: {
        type: String,
        enum: ['published', 'hidden'],
        default: 'published',
    },
    isDriverReviewApplicable: Boolean,
}, { timestamps: true });

reviewSchema.index({ vehicleId: 1, status: 1 });
reviewSchema.index({ bookingId: 1, reviewType: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
