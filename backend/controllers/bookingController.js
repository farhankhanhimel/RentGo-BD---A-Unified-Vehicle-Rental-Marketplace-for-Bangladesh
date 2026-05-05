const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const RoutePackage = require('../models/RoutePackage');
const { validateCoupon } = require('../utils/couponValidator');
const { checkVehicleAvailability } = require('../utils/availabilityChecker');
const { notifyEmergencyBooking } = require('../services/emergencyNotificationService');

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const normalizeLocation = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    return location.address || location.name || '';
};

const formatBooking = (bookingDoc) => {
    const booking = bookingDoc.toObject ? bookingDoc.toObject() : bookingDoc;
    const vehicle = booking.vehicle?.make ? booking.vehicle : booking.vehicleId || {};

    return {
        ...booking,
        customerId: booking.customerId || booking.customer,
        vendorId: booking.vendorId || booking.vendor,
        vehicleId: booking.vehicleId || booking.vehicle,
        tripDetails: {
            ...booking.tripDetails,
            startDate: booking.tripDetails?.startDate || booking.tripDetails?.pickupDate,
            endDate: booking.tripDetails?.endDate || booking.tripDetails?.returnDate,
            pickupLocation: booking.tripDetails?.pickupLocation,
            dropLocation: booking.tripDetails?.dropoffLocation || booking.tripDetails?.dropLocation,
        },
        pricing: {
            ...booking.pricing,
            advanceAmount: booking.pricing?.advanceAmount || booking.pricing?.advancePaid || 0,
            total: booking.pricing?.totalAmount || 0,
        },
        vehicleIdLegacy: {
            _id: vehicle._id,
            specs: {
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                seats: vehicle.features?.seats,
                fuelType: vehicle.features?.fuelType,
                transmission: vehicle.features?.transmission,
                ac: vehicle.features?.ac,
            },
            media: {
                photos: (vehicle.photos || []).map((photo) => (typeof photo === 'string' ? { url: photo } : photo)),
            },
            vehicleType: vehicle.vehicleType,
            pricing: vehicle.pricing,
        },
    };
};

// @desc    Create a booking
// @route   POST /api/bookings/
// @access  Customer
exports.createBooking = async (req, res) => {
    try {
        const customerId = req.user._id;
        const {
            vehicleId,
            bookingMode,
            tripDetails,
            couponCode,
            isEmergency,
            emergencyNotes,
            routePackage,
        } = req.body;

        // Fetch vehicle
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (!vehicle.isApproved) {
            return res.status(400).json({ message: 'Vehicle is not available for booking' });
        }

        const pickupDate = tripDetails.startDate || tripDetails.pickupDate;
        const returnDate = tripDetails.endDate || tripDetails.returnDate;
        const pickupLocation = normalizeLocation(tripDetails.pickupLocation) || tripDetails.pickupLocation || '';
        const dropoffLocation = normalizeLocation(tripDetails.dropLocation) || normalizeLocation(tripDetails.dropoffLocation) || '';
        const withDriver = Boolean(tripDetails.withDriver);
        const tripType = tripDetails.tripType || 'other';
        const specialNotes = tripDetails.specialNotes || '';
        const emergencyRequested = Boolean(isEmergency || tripType === 'emergency');
        const emergencyMessage = emergencyNotes || specialNotes || '';

        if (!pickupDate || !returnDate || !pickupLocation) {
            return res.status(400).json({ message: 'Pickup date, return date, and pickup location are required' });
        }

        // Check availability
        const { available } = await checkVehicleAvailability(
            vehicleId,
            pickupDate,
            returnDate
        );

        if (!available) {
            return res.status(409).json({
                message: 'Vehicle is not available for the selected dates',
            });
        }

        // Calculate pricing server-side
        const start = new Date(pickupDate);
        const end = new Date(returnDate);
        const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

        let packageDoc = null;
        if (routePackage?.id && mongoose.isValidObjectId(routePackage.id)) {
            packageDoc = await RoutePackage.findOne({
                _id: routePackage.id,
                active: true,
            });

            if (!packageDoc) {
                return res.status(404).json({ message: 'Route package not found or inactive' });
            }

            if (packageDoc.vehicle && packageDoc.vehicle.toString() !== vehicle._id.toString()) {
                return res.status(400).json({ message: 'Selected vehicle does not belong to this route package' });
            }

            if (packageDoc.vendor && vehicle.vendor.toString() !== packageDoc.vendor.toString()) {
                return res.status(400).json({ message: 'Selected vehicle does not belong to this route package vendor' });
            }
        }

        const packageUnits = packageDoc
            ? Math.max(1, Math.ceil(days / Math.max(1, packageDoc.durationDays || 1)))
            : 1;
        const baseRate = packageDoc
            ? packageDoc.priceMin * packageUnits
            : vehicle.pricing.dailyRate * days;
        const driverFee = withDriver && !(packageDoc?.withDriver)
            ? (vehicle.pricing.driverSurcharge || 0) * days
            : 0;
        const serviceFee = Math.round((baseRate + driverFee) * 0.08);

        let couponDiscount = 0;
        let appliedCouponCode = '';
        if (couponCode) {
            const couponResult = await validateCoupon(
                couponCode,
                customerId,
                baseRate + driverFee + serviceFee,
                vehicle.vehicleType,
                tripType
            );
            if (!couponResult.valid) {
                return res.status(400).json({ message: couponResult.error });
            }
            couponDiscount = couponResult.discount;
            appliedCouponCode = couponResult.coupon.code;
        }

        const totalAmount = baseRate + driverFee + serviceFee - couponDiscount;
        const advanceAmount = Math.round(totalAmount * 0.30);

        // Determine initial status based on booking mode
        const status = bookingMode === 'instant' ? 'payment_awaited' : 'pending_vendor_approval';
        const expiresAt = bookingMode === 'request'
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null;
        let booking;

        // Atomic-like: second availability check right before create
        try {
            const { available: stillAvailable } = await checkVehicleAvailability(
                vehicleId,
                pickupDate,
                returnDate
            );

            if (!stillAvailable) {
                return res.status(409).json({
                    message: 'This vehicle is no longer available for the selected dates. Please choose different dates.',
                });
            }

            const bookingData = {
                customerId,
                customer: customerId,
                vendorId: vehicle.vendor,
                vendor: vehicle.vendor,
                vehicleId: vehicle._id,
                vehicle: vehicle._id,
                bookingMode,
                status,
                tripDetails,
                expiresAt,
                pricing: {
                    baseRate,
                    driverFee,
                    serviceFee,
                    couponDiscount,
                    couponCode: appliedCouponCode,
                    totalAmount,
                    advanceAmount,
                    advancePaid: 0,
                    balanceDue: totalAmount - advanceAmount,
                    currency: 'BDT',
                },
                paymentStatus: 'pending',
                totalAmount,
                paidAmount: 0,
                transactionId: '',
                isEmergency: emergencyRequested,
                emergencyStatus: emergencyRequested ? 'broadcast' : 'queued',
                emergencyNotes: emergencyMessage,
                emergencyAlertSentAt: emergencyRequested ? new Date() : undefined,
                responseDueAt: emergencyRequested ? new Date(Date.now() + 30 * 60 * 1000) : undefined,
                statusHistory: [
                    {
                        status,
                        changedAt: new Date(),
                        changedBy: customerId,
                        note: `Booking created via ${bookingMode} mode`,
                    },
                ],
                tripDetails: {
                    pickupLocation,
                    dropoffLocation,
                    pickupDate,
                    returnDate,
                    startDate: pickupDate,
                    endDate: returnDate,
                    tripType,
                    withDriver,
                    specialNotes: packageDoc
                        ? `${specialNotes ? `${specialNotes} | ` : ''}Route package: ${packageDoc.routeName}`
                        : specialNotes,
                },
            };

            booking = await Booking.create(bookingData);
        } catch (error) {
            throw error;
        }

        if (packageDoc) {
            packageDoc.bookingsCount = (packageDoc.bookingsCount || 0) + 1;
            await packageDoc.save();
        }

        if (emergencyRequested) {
            try {
                await notifyEmergencyBooking(booking._id);
            } catch (notifyError) {
                console.error('Emergency notification failed:', notifyError);
            }
        }

        // Emit Socket.io event
        if (req.app.get('io')) {
            req.app.get('io').to(`user_${vehicle.vendor}`).emit('new_booking_request', {
                bookingId: booking.bookingId,
                vehicleId,
                customerName: req.user.name,
                dates: {
                    start: pickupDate,
                    end: returnDate,
                },
            });

            // Emit availability update to vehicle room (F9-SOCKET-02 fix)
            req.app.get('io').to(`vehicle_${vehicleId}`).emit('availability_updated', { vehicleId });
        }

        const responseBooking = formatBooking(booking);
        responseBooking.vehicle = {
            _id: vehicle._id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vehicleType: vehicle.vehicleType,
            features: vehicle.features,
            pricing: vehicle.pricing,
            photos: vehicle.photos,
        };

        res.status(201).json({
            message: bookingMode === 'instant'
                ? emergencyRequested
                    ? 'Emergency booking created. Nearby vendors have been notified.'
                    : 'Booking created. Proceed to payment.'
                : 'Booking request submitted. Vendor will respond within 24 hours.',
            booking: responseBooking,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Vendor respond to booking request
// @route   PATCH /api/bookings/:id/respond
// @access  Vendor
exports.vendorRespondToBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.vendorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (booking.status !== 'pending_vendor_approval') {
            return res.status(400).json({ message: 'Booking is not in pending state' });
        }

        const { action, reason } = req.body;

        if (action === 'approve') {
            booking.status = 'payment_awaited';
            booking.statusHistory.push({
                status: 'payment_awaited',
                changedAt: new Date(),
                changedBy: req.user._id,
                note: 'Vendor approved the booking',
            });

            if (req.app.get('io')) {
                req.app.get('io').to(`user_${booking.customerId}`).emit('booking_approved', {
                    bookingId: booking.bookingId,
                });
            }
        } else if (action === 'decline') {
            booking.status = 'cancelled';
            booking.vendorDeclineReason = reason || 'No reason provided';
            booking.cancelledBy = 'vendor';
            booking.statusHistory.push({
                status: 'cancelled',
                changedAt: new Date(),
                changedBy: req.user._id,
                note: `Vendor declined: ${booking.vendorDeclineReason}`,
            });

            if (req.app.get('io')) {
                req.app.get('io').to(`user_${booking.customerId}`).emit('booking_declined', {
                    bookingId: booking.bookingId,
                    reason: booking.vendorDeclineReason,
                });
            }
        } else {
            return res.status(400).json({ message: 'action must be "approve" or "decline"' });
        }

        await booking.save();

        res.json({ message: `Booking ${action}d`, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Placeholder Payment
// @route   PATCH /api/bookings/:id/pay
// @access  Customer
exports.mockPayment = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (booking.status !== 'payment_awaited') {
            return res.status(400).json({ message: 'Booking is not awaiting payment' });
        }

        const paymentType = req.body?.type || 'full';

        booking.status = 'confirmed';
        booking.payment.advancePaid = paymentType === 'advance' || paymentType === 'full';
        booking.payment.fullPaid = paymentType === 'full';

        booking.statusHistory.push({
            status: 'confirmed',
            changedAt: new Date(),
            changedBy: req.user._id,
            note: `Payment completed successfully (${paymentType})`,
        });

        await booking.save();

        if (req.app.get('io')) {
            req.app.get('io').to(`user_${booking.vendorId}`).emit('booking_paid', {
                bookingId: booking.bookingId,
            });
        }

        res.json({ message: 'Payment successful. Booking confirmed!', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Vendor update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Vendor
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['ongoing', 'completed'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status update' });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.vendorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const validTransitions = {
            ongoing: ['confirmed'],
            completed: ['ongoing'],
        };

        if (!validTransitions[status].includes(booking.status)) {
            return res.status(400).json({ message: 'Invalid status transition' });
        }

        booking.status = status;
        booking.statusHistory.push({
            status,
            changedAt: new Date(),
            changedBy: req.user._id,
            note: `Vendor marked booking as ${status}`,
        });

        await booking.save();

        if (req.app.get('io')) {
            req.app.get('io').to(`user_${booking.customerId}`).emit('booking_status_updated', {
                bookingId: booking.bookingId,
                status,
            });

            req.app.get('io').to(`vehicle_${booking.vehicleId}`).emit('availability_updated', {
                vehicleId: booking.vehicleId,
            });
        }

        res.json({ message: `Booking marked as ${status}`, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Customer|Vendor
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const userId = req.user._id.toString();
        const isCustomer = booking.customerId.toString() === userId;
        const isVendor = booking.vendorId.toString() === userId;

        if (!isCustomer && !isVendor) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const cancellableStatuses = [
            'pending_vendor_approval',
            'vendor_approved',
            'payment_awaited',
            'confirmed',
        ];

        if (!cancellableStatuses.includes(booking.status)) {
            return res.status(400).json({ message: 'Booking cannot be cancelled in its current state' });
        }

        booking.status = 'cancelled';
        booking.cancelledBy = isCustomer ? 'customer' : 'vendor';
        booking.cancellationReason = req.body.reason || 'No reason provided';
        booking.statusHistory.push({
            status: 'cancelled',
            changedAt: new Date(),
            changedBy: req.user._id,
            note: `Cancelled by ${booking.cancelledBy}: ${booking.cancellationReason}`,
        });

        await booking.save();

        // Notify the other party
        const notifyUserId = isCustomer ? booking.vendorId : booking.customerId;
        if (req.app.get('io')) {
            req.app.get('io').to(`user_${notifyUserId}`).emit('booking_cancelled', {
                bookingId: booking.bookingId,
                cancelledBy: booking.cancelledBy,
            });

            // Emit availability update to vehicle room
            req.app.get('io').to(`vehicle_${booking.vehicleId}`).emit('availability_updated', {
                vehicleId: booking.vehicleId,
            });
        }

        res.json({ message: 'Booking cancelled', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get customer's bookings
// @route   GET /api/bookings/my
// @access  Customer
exports.getCustomerBookings = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { customerId: req.user._id };
        if (status) query.status = status;

        const bookings = await Booking.find(query)
            .populate('vehicle', 'make model year photos vehicleType pricing features')
            .populate('vendor', 'name phone email vendorDetails')
            .sort({ createdAt: -1 });

        res.json({ bookings: bookings.map(formatBooking), count: bookings.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vendor's bookings
// @route   GET /api/bookings/vendor
// @access  Vendor
exports.getVendorBookings = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { vendorId: req.user._id };
        if (status) query.status = status;

        const bookings = await Booking.find(query)
            .populate('vehicle', 'make model year photos vehicleType pricing features')
            .populate('customer', 'name phone email avatar')
            .sort({ createdAt: -1 });

        res.json({ bookings: bookings.map(formatBooking), count: bookings.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Customer|Vendor
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('vehicle')
            .populate('customer', 'name phone email avatar')
            .populate('vendor', 'name phone email vendorDetails');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const userId = req.user._id.toString();
        if (
            booking.customer._id.toString() !== userId &&
            booking.vendor._id.toString() !== userId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(formatBooking(booking));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
