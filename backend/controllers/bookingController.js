const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { checkVehicleAvailability } = require('../utils/availabilityChecker');

// @desc    Create a booking
// @route   POST /api/bookings/
// @access  Customer
exports.createBooking = async (req, res) => {
    try {
        const customerId = req.user._id;
        const {
            vehicleId, bookingMode, tripDetails,
        } = req.body;

        // Fetch vehicle
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicle.status !== 'approved') {
            return res.status(400).json({ message: 'Vehicle is not available for booking' });
        }

        // Check availability
        const { available } = await checkVehicleAvailability(
            vehicleId,
            tripDetails.startDate,
            tripDetails.endDate
        );

        if (!available) {
            return res.status(409).json({
                message: 'Vehicle is not available for the selected dates',
            });
        }

        // Calculate pricing server-side
        const start = new Date(tripDetails.startDate);
        const end = new Date(tripDetails.endDate);
        const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

        const baseRate = vehicle.pricing.dailyRate * days;
        const driverFee = tripDetails.withDriver
            ? (vehicle.pricing.driverSurcharge || 0) * days
            : 0;
        const serviceFee = Math.round(baseRate * 0.08);

        let multiDayDiscount = 0;
        if (days >= 3 && vehicle.pricing.multiDayDiscount > 0) {
            multiDayDiscount = Math.round(baseRate * (vehicle.pricing.multiDayDiscount / 100));
        }

        const totalAmount = baseRate + driverFee + serviceFee - multiDayDiscount;
        const advanceAmount = Math.round(totalAmount * 0.30);

        // Determine initial status based on booking mode
        const status = bookingMode === 'instant' ? 'payment_awaited' : 'pending_vendor_approval';
        const expiresAt = bookingMode === 'request'
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null;

        // Atomic-like: second availability check right before create
        try {
            const { available: stillAvailable } = await checkVehicleAvailability(
                vehicleId,
                tripDetails.startDate,
                tripDetails.endDate
            );

            if (!stillAvailable) {
                return res.status(409).json({
                    message: 'This vehicle is no longer available for the selected dates. Please choose different dates.',
                });
            }

            const bookingDocs = await Booking.create([{
                customerId,
                vendorId: vehicle.vendorId,
                vehicleId,
                bookingMode,
                status,
                tripDetails,
                pricing: {
                    baseRate,
                    driverFee,
                    serviceFee,
                    couponDiscount: 0,
                    totalAmount,
                    advanceAmount,
                    balanceDue: totalAmount - advanceAmount,
                    currency: 'BDT',
                },
                statusHistory: [
                    {
                        status,
                        changedAt: new Date(),
                        changedBy: customerId,
                        note: `Booking created via ${bookingMode} mode`,
                    },
                ],
                expiresAt,
            }]);
            booking = bookingDocs[0];
        } catch (error) {
            throw error;
        }

        // Emit Socket.io event
        if (req.app.get('io')) {
            req.app.get('io').to(`user_${vehicle.vendorId}`).emit('new_booking_request', {
                bookingId: booking.bookingId,
                vehicleId,
                customerName: req.user.name,
                dates: {
                    start: tripDetails.startDate,
                    end: tripDetails.endDate,
                },
            });

            // Emit availability update to vehicle room (F9-SOCKET-02 fix)
            req.app.get('io').to(`vehicle_${vehicleId}`).emit('availability_updated', { vehicleId });
        }

        res.status(201).json({
            message: bookingMode === 'instant'
                ? 'Booking created. Proceed to payment.'
                : 'Booking request submitted. Vendor will respond within 24 hours.',
            booking,
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
            .populate('vehicleId', 'specs.make specs.model media.photos vehicleType pricing.dailyRate')
            .populate('vendorId', 'name phone')
            .sort({ createdAt: -1 });

        res.json({ bookings, count: bookings.length });
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
            .populate('vehicleId', 'specs.make specs.model media.photos vehicleType pricing.dailyRate')
            .populate('customerId', 'name phone email')
            .sort({ createdAt: -1 });

        res.json({ bookings, count: bookings.length });
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
            .populate('vehicleId')
            .populate('customerId', 'name phone email avatar')
            .populate('vendorId', 'name phone email vendorDetails');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const userId = req.user._id.toString();
        if (
            booking.customerId._id.toString() !== userId &&
            booking.vendorId._id.toString() !== userId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
