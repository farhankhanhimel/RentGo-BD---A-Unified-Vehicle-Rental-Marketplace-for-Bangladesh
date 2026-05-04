const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: { type: String, unique: true },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },
    bookingMode: {
        type: String,
        enum: ['instant', 'request'],
        required: true,
    },
    status: {
        type: String,
        enum: [
            'pending_vendor_approval',
            'vendor_approved',
            'payment_awaited',
            'confirmed',
            'ongoing',
            'completed',
            'cancelled',
            'expired',
            'payment_failed',
        ],
        default: 'pending_vendor_approval',
    },
    tripDetails: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        pickupLocation: {
            address: String,
            coordinates: { lat: Number, lng: Number },
        },
        dropLocation: {
            address: String,
            coordinates: { lat: Number, lng: Number },
        },
        tripType: {
            type: String,
            enum: ['tourism', 'airport', 'wedding', 'office', 'emergency'],
        },
        withDriver: Boolean,
        specialNotes: String,
    },
    pricing: {
        baseRate: Number,
        driverFee: Number,
        serviceFee: Number,
        couponDiscount: Number,
        couponCode: String,
        totalAmount: Number,
        advanceAmount: Number,
        balanceDue: Number,
        currency: { type: String, default: 'BDT' },
    },
    payment: {
        advancePaid: Boolean,
        advanceTransactionId: String,
        advancePaidAt: Date,
        fullPaid: Boolean,
        fullTransactionId: String,
    },
    statusHistory: [
        {
            status: String,
            changedAt: Date,
            changedBy: mongoose.Schema.Types.ObjectId,
            note: String,
        },
    ],
    vendorDeclineReason: String,
    cancellationReason: String,
    cancelledBy: {
        type: String,
        enum: ['customer', 'vendor', 'system'],
    },
    expiresAt: Date,
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

// Auto-generate bookingId before save
bookingSchema.pre('save', function (next) {
    if (!this.bookingId) {
        this.bookingId =
            'RG-' +
            Date.now().toString(36).toUpperCase() +
            '-' +
            Math.random().toString(36).slice(2, 5).toUpperCase();
    }
    next();
});

bookingSchema.index({ vehicleId: 1, 'tripDetails.startDate': 1, 'tripDetails.endDate': 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
