const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vehicleType: {
        type: String,
        enum: ['car', 'motorcycle', 'microbus', 'van', 'pickup', 'bus'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending_approval', 'approved', 'rejected', 'deactivated'],
        default: 'pending_approval',
    },
    adminRejectionReason: String,
    specs: {
        make: { type: String, required: true },
        model: { type: String, required: true },
        year: { type: Number, required: true },
        registrationNo: { type: String, required: true, unique: true },
        seats: { type: Number, required: true },
        ac: { type: Boolean, default: false },
        gps: { type: Boolean, default: false },
        transmission: { type: String, enum: ['manual', 'automatic'] },
        fuelType: { type: String, enum: ['petrol', 'diesel', 'cng', 'electric'] },
        insuranceExpiry: Date,
        conditionDescription: String,
    },
    pricing: {
        hourlyRate: Number,
        dailyRate: { type: Number, required: true },
        multiDayDiscount: { type: Number, default: 0 },
        driverSurcharge: { type: Number, default: 0 },
        fuelIncluded: { type: Boolean, default: false },
        securityDeposit: { type: Number, default: 0 },
        promotionalPricing: [
            {
                startDate: Date,
                endDate: Date,
                discountPercent: Number,
            },
        ],
    },
    media: {
        photos: [
            {
                url: String,
                publicId: String,
            },
        ],
        primaryPhotoIndex: { type: Number, default: 0 },
    },
    location: {
        city: { type: String, required: true },
        district: String,
        area: String,
        coordinates: {
            lat: Number,
            lng: Number,
        },
    },
    rentalModes: {
        selfDrive: { type: Boolean, default: true },
        withDriver: { type: Boolean, default: false },
    },
    driverProfile: {
        name: String,
        phone: String,
        licenseNumber: String,
        licenseExpiry: Date,
        yearsExperience: Number,
        languages: [String],
        rating: Number,
        photoUrl: String,
    },
    availability: {
        type: String,
        enum: ['available', 'unavailable'],
        default: 'available',
    },
    meta: {
        totalBookings: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
    },
}, { timestamps: true });

vehicleSchema.index({ 'location.city': 1, status: 1 });
vehicleSchema.index({ vendorId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
