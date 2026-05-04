const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// @desc    Submit a review
// @route   POST /api/reviews/
// @access  Customer|Vendor
exports.submitReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookingId, vehicleRating, customerRating, comment } = req.body;

        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify booking is completed
        if (booking.status !== 'completed') {
            return res.status(403).json({ message: 'Booking must be completed before leaving a review' });
        }

        // Determine review type based on user role
        const isCustomer = booking.customerId.toString() === userId.toString();
        const isVendor = booking.vendorId.toString() === userId.toString();

        if (!isCustomer && !isVendor) {
            return res.status(403).json({ message: 'Not authorized to review this booking' });
        }

        const reviewType = isCustomer ? 'customer_reviews_vehicle' : 'vendor_reviews_customer';

        // Check if already reviewed
        const existingReview = await Review.findOne({ bookingId, reviewType });
        if (existingReview) {
            return res.status(409).json({ message: 'You have already reviewed this booking' });
        }

        // Calculate overall rating
        let reviewData = {
            bookingId,
            vehicleId: booking.vehicleId,
            vendorId: booking.vendorId,
            customerId: booking.customerId,
            reviewType,
            comment,
            isDriverReviewApplicable: booking.tripDetails?.withDriver || false,
        };

        if (isCustomer && vehicleRating) {
            const ratings = [
                vehicleRating.condition,
                vehicleRating.cleanliness,
                vehicleRating.valueMoney,
            ].filter(Boolean);

            if (vehicleRating.driverBehaviour) {
                ratings.push(vehicleRating.driverBehaviour);
            }

            const overall = ratings.length > 0
                ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
                : 0;

            reviewData.vehicleRating = {
                ...vehicleRating,
                overall,
            };
        }

        if (isVendor && customerRating) {
            const ratings = [
                customerRating.punctuality,
                customerRating.communication,
                customerRating.vehicleCare,
            ].filter(Boolean);

            const overall = ratings.length > 0
                ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
                : 0;

            reviewData.customerRating = {
                ...customerRating,
                overall,
            };
        }

        const review = await Review.create(reviewData);

        // Update vehicle meta stats if customer review
        if (isCustomer && review.vehicleRating?.overall) {
            const vehicle = await Vehicle.findById(booking.vehicleId);
            if (vehicle) {
                const newTotal = vehicle.meta.totalReviews + 1;
                const newAvg =
                    (vehicle.meta.averageRating * vehicle.meta.totalReviews + review.vehicleRating.overall) /
                    newTotal;

                vehicle.meta.totalReviews = newTotal;
                vehicle.meta.averageRating = Math.round(newAvg * 10) / 10;
                await vehicle.save();
            }
        }

        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vehicle reviews
// @route   GET /api/reviews/vehicle/:vehicleId
// @access  Public
exports.getVehicleReviews = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {
            vehicleId,
            reviewType: 'customer_reviews_vehicle',
            status: 'published',
        };

        const [reviews, totalCount] = await Promise.all([
            Review.find(filter)
                .populate('customerId', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(filter),
        ]);

        // Calculate rating breakdown
        let ratingBreakdown = {};
        if (totalCount > 0) {
            const allReviews = await Review.find(filter).select('vehicleRating');
            const totals = { condition: 0, cleanliness: 0, driverBehaviour: 0, valueMoney: 0 };
            let driverCount = 0;

            allReviews.forEach((r) => {
                totals.condition += r.vehicleRating?.condition || 0;
                totals.cleanliness += r.vehicleRating?.cleanliness || 0;
                if (r.vehicleRating?.driverBehaviour) {
                    totals.driverBehaviour += r.vehicleRating.driverBehaviour;
                    driverCount++;
                }
                totals.valueMoney += r.vehicleRating?.valueMoney || 0;
            });

            ratingBreakdown = {
                condition: Number((totals.condition / totalCount).toFixed(1)),
                cleanliness: Number((totals.cleanliness / totalCount).toFixed(1)),
                driverBehaviour: driverCount > 0 ? Number((totals.driverBehaviour / driverCount).toFixed(1)) : null,
                valueMoney: Number((totals.valueMoney / totalCount).toFixed(1)),
            };
        }

        // Get average rating
        const vehicle = await Vehicle.findById(vehicleId).select('meta');
        const averageRating = vehicle?.meta?.averageRating || 0;

        res.json({
            reviews,
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
            averageRating,
            ratingBreakdown,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if user can review a booking
// @route   GET /api/reviews/can-review/:bookingId
// @access  Customer|Vendor
exports.checkReviewEligibility = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ canReview: false, reason: 'Booking not found' });
        }

        if (booking.status !== 'completed') {
            return res.json({ canReview: false, reason: 'Booking must be completed to leave a review' });
        }

        const isCustomer = booking.customerId.toString() === userId.toString();
        const isVendor = booking.vendorId.toString() === userId.toString();

        if (!isCustomer && !isVendor) {
            return res.json({ canReview: false, reason: 'Not associated with this booking' });
        }

        const reviewType = isCustomer ? 'customer_reviews_vehicle' : 'vendor_reviews_customer';
        const existing = await Review.findOne({ bookingId, reviewType });

        if (existing) {
            return res.json({ canReview: false, reason: 'You have already reviewed this booking' });
        }

        res.json({ canReview: true, reason: null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
