const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const { generateBookingCSV, generateBookingSummary, generateBookingPDFReport } = require('../utils/reportGenerator');

/**
 * Vendor Booking Management Controller
 * Feature 13 — Tasfy
 * Handles: listing, filtering, status updates, stats, reports
 */

// @desc    Get all bookings for vendor (with filters, search, pagination)
// @route   GET /api/vendor-bookings
// @access  Private/Vendor
exports.getVendorBookings = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      vehicleType,
      tripType,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pendingStatuses = ['pending', 'pending_vendor_approval'];

    // Build query
    const query = { vendor: req.user._id };

    if (status && status !== 'all') {
      query.status = status === 'pending' ? { $in: pendingStatuses } : status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (tripType && tripType !== 'all') {
      query['tripDetails.tripType'] = tripType;
    }

    // Date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    // Build the base query with population
    let bookingQuery = Booking.find(query)
      .populate('customer', 'name email phone avatar')
      .populate('vehicle', 'make model year vehicleType photos pricing features');

    // Vehicle type filter (requires post-filter since it's in populated field)
    let bookings;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    if (vehicleType && vehicleType !== 'all') {
      // Get vendor's vehicles of this type first
      const vehicles = await Vehicle.find({
        vendor: req.user._id,
        vehicleType: vehicleType,
      }).select('_id');
      const vehicleIds = vehicles.map((v) => v._id);
      query.vehicle = { $in: vehicleIds };
      bookingQuery = Booking.find(query)
        .populate('customer', 'name email phone avatar')
        .populate('vehicle', 'make model year vehicleType photos pricing features');
    }

    // Search by booking ID or customer name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      // We need to handle search across populated fields
      // First try booking ID match
      const bookingIdMatch = await Booking.find({
        ...query,
        bookingId: searchRegex,
      }).select('_id');

      // Then try customer name match
      const User = require('../models/User');
      const matchingUsers = await User.find({ name: searchRegex }).select('_id');

      const orConditions = [
        { _id: { $in: bookingIdMatch.map((b) => b._id) } },
      ];
      if (matchingUsers.length > 0) {
        orConditions.push({ customer: { $in: matchingUsers.map((u) => u._id) } });
      }

      bookingQuery = Booking.find({
        ...query,
        $or: orConditions,
      })
        .populate('customer', 'name email phone avatar')
        .populate('vehicle', 'make model year vehicleType photos pricing features');
    }

    const total = await Booking.countDocuments(
      search
        ? {
            ...query,
            $or: [
              { bookingId: new RegExp(search, 'i') },
            ],
          }
        : query
    );

    bookings = await bookingQuery
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get vendor bookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// @desc    Get single booking details
// @route   GET /api/vendor-bookings/:id
// @access  Private/Vendor
exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    })
      .populate('customer', 'name email phone avatar address')
      .populate('vehicle', 'make model year vehicleType photos pricing features location registration')
      .populate('statusHistory.updatedBy', 'name role');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking detail error:', error);
    res.status(500).json({ message: 'Server error fetching booking' });
  }
};

// @desc    Update booking status (vendor actions)
// @route   PUT /api/vendor-bookings/:id/status
// @access  Private/Vendor
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, note, reason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'declined'],
      pending_vendor_approval: ['confirmed', 'declined'],
      confirmed: ['vehicle_handed_over', 'cancelled'],
      vehicle_handed_over: ['trip_started'],
      trip_started: ['trip_completed'],
      declined: [],
      cancelled: [],
      trip_completed: [],
      expired: [],
    };

    const allowedNext = validTransitions[booking.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from '${booking.status}' to '${status}'. Allowed: ${allowedNext.join(', ') || 'none'}`,
      });
    }

    // Update status
    booking.status = status;
    booking.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id,
    });

    // Handle specific status changes
    if (status === 'confirmed') {
      booking.vendorResponse = {
        action: 'approved',
        respondedAt: new Date(),
      };
    } else if (status === 'declined') {
      booking.vendorResponse = {
        action: 'declined',
        reason: reason || 'Declined by vendor',
        respondedAt: new Date(),
      };
    } else if (status === 'trip_completed') {
      // Mark fully paid if no balance
      if (booking.pricing.balanceDue <= 0) {
        booking.paymentStatus = 'paid';
      }
    }

    await booking.save();

    // Send notification to customer
    const statusMessages = {
      confirmed: 'Your booking has been confirmed by the vendor.',
      declined: `Your booking was declined. ${reason ? `Reason: ${reason}` : ''}`,
      vehicle_handed_over: 'The vehicle is ready for pickup.',
      trip_started: 'Your trip has started. Have a safe journey!',
      trip_completed: 'Your trip is completed. Thank you for riding with us!',
      cancelled: 'Your booking has been cancelled by the vendor.',
    };

    if (statusMessages[status]) {
      await Notification.create({
        user: booking.customer,
        type: `booking_${status === 'confirmed' ? 'confirmed' : 'update'}`,
        title: `Booking ${status.replace(/_/g, ' ').toUpperCase()}`,
        message: statusMessages[status],
        relatedBooking: booking._id,
        actionUrl: `/bookings/${booking._id}`,
      });
    }

    // Populate and return
    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone avatar')
      .populate('vehicle', 'make model year vehicleType photos pricing features');

    res.json(updatedBooking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error updating booking' });
  }
};

// @desc    Update payment status
// @route   PUT /api/vendor-bookings/:id/payment
// @access  Private/Vendor
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, advancePaid, transactionId } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }

    if (advancePaid !== undefined) {
      booking.pricing.advancePaid = advancePaid;
      booking.pricing.balanceDue = booking.pricing.totalAmount - advancePaid;
    }

    if (transactionId) {
      booking.transactionId = transactionId;
    }

    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      note: `Payment updated: ${paymentStatus || 'advance recorded'}`,
      updatedBy: req.user._id,
    });

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone avatar')
      .populate('vehicle', 'make model year vehicleType photos pricing features');

    res.json(updatedBooking);
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error updating payment' });
  }
};

// @desc    Get vendor booking statistics
// @route   GET /api/vendor-bookings/stats
// @access  Private/Vendor
exports.getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get all bookings for this vendor
    const allBookings = await Booking.find({ vendor: vendorId })
      .populate('vehicle', 'vehicleType');

    const summary = generateBookingSummary(allBookings);

    // Active bookings (confirmed/in-progress)
    const activeBookings = allBookings.filter((b) =>
      ['confirmed', 'vehicle_handed_over', 'trip_started'].includes(b.status)
    ).length;

    // Pending bookings requiring action
    const pendingStatuses = ['pending', 'pending_vendor_approval'];
    const pendingBookings = allBookings.filter((b) => pendingStatuses.includes(b.status)).length;

    // Recent completion rate
    const completedBookings = allBookings.filter((b) => b.status === 'trip_completed').length;
    const totalNonPending = allBookings.filter((b) => !pendingStatuses.includes(b.status)).length;
    const completionRate = totalNonPending > 0
      ? Math.round((completedBookings / totalNonPending) * 100)
      : 0;

    // Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = allBookings.filter(
      (b) => new Date(b.createdAt) >= today
    ).length;

    if (summary.statusBreakdown?.pending_vendor_approval) {
      summary.statusBreakdown.pending = (summary.statusBreakdown.pending || 0) + summary.statusBreakdown.pending_vendor_approval;
      delete summary.statusBreakdown.pending_vendor_approval;
    }

    res.json({
      ...summary,
      activeBookings,
      pendingBookings,
      completedBookings,
      completionRate,
      todayBookings,
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// @desc    Export bookings as CSV or PDF
// @route   GET /api/vendor-bookings/export
// @access  Private/Vendor
exports.exportBookings = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, format = 'csv' } = req.query;

    const query = { vendor: req.user._id };
    if (status && status !== 'all') query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'make model year vehicleType')
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found to export' });
    }

    if (format === 'pdf') {
      const vendorName = req.user.vendorDetails?.businessName || req.user.name || 'Vendor';
      const dateRange = {
        from: dateFrom || 'All time',
        to: dateTo || 'Present',
      };

      const { PassThrough } = require('stream');
      const stream = new PassThrough();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=bookings_report_${new Date().toISOString().split('T')[0]}.pdf`
      );

      stream.pipe(res);

      await generateBookingPDFReport(bookings, vendorName, dateRange, stream);
    } else {
      const csv = generateBookingCSV(bookings);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=bookings_${new Date().toISOString().split('T')[0]}.csv`
      );
      res.send(csv);
    }
  } catch (error) {
    console.error('Export bookings error:', error);
    res.status(500).json({ message: 'Server error exporting bookings' });
  }
};

// @desc    Get vendor booking calendar data
// @route   GET /api/vendor-bookings/calendar
// @access  Private/Vendor
exports.getCalendarBookings = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

    const bookings = await Booking.find({
      vendor: req.user._id,
      'tripDetails.pickupDate': { $lte: endDate },
      'tripDetails.returnDate': { $gte: startDate },
      status: { $nin: ['cancelled', 'declined', 'expired'] },
    })
      .populate('customer', 'name phone')
      .populate('vehicle', 'make model vehicleType')
      .select('bookingId customer vehicle tripDetails status pricing.totalAmount')
      .sort({ 'tripDetails.pickupDate': 1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get calendar bookings error:', error);
    res.status(500).json({ message: 'Server error fetching calendar data' });
  }
};

// @desc    Respond to a request-mode booking (approve/decline)
// @route   PUT /api/vendor-bookings/:id/respond
// @access  Private/Vendor
exports.respondToBooking = async (req, res) => {
  try {
    const { action, reason, note } = req.body;

    if (!action || !['approve', 'decline'].includes(action)) {
      return res.status(400).json({ message: "action must be 'approve' or 'decline'" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const pendingStatuses = ['pending', 'pending_vendor_approval'];
    if (!pendingStatuses.includes(booking.status)) {
      return res.status(400).json({ message: `Cannot respond to a booking with status '${booking.status}'. Only pending bookings can be responded to.` });
    }

    if (booking.bookingMode !== 'request') {
      return res.status(400).json({ message: 'This endpoint is for request-mode bookings. Use /status for instant bookings.' });
    }

    const newStatus = action === 'approve' ? 'confirmed' : 'declined';

    booking.status = newStatus;
    booking.vendorResponse = {
      action: action === 'approve' ? 'approved' : 'declined',
      reason: reason || (action === 'decline' ? 'Declined by vendor' : ''),
      respondedAt: new Date(),
    };
    booking.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || (action === 'approve' ? 'Booking approved by vendor' : `Booking declined by vendor. ${reason || ''}`),
      updatedBy: req.user._id,
    });

    await booking.save();

    // Notify customer
    const message = action === 'approve'
      ? 'Your booking request has been approved by the vendor!'
      : `Your booking request was declined. ${reason ? `Reason: ${reason}` : ''}`;

    await Notification.create({
      user: booking.customer,
      type: action === 'approve' ? 'booking_confirmed' : 'booking_update',
      title: action === 'approve' ? 'Booking Approved' : 'Booking Declined',
      message,
      relatedBooking: booking._id,
      actionUrl: `/bookings/${booking._id}`,
    });

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone avatar')
      .populate('vehicle', 'make model year vehicleType photos pricing features');

    res.json(updatedBooking);
  } catch (error) {
    console.error('Respond to booking error:', error);
    res.status(500).json({ message: 'Server error responding to booking' });
  }
};

// @desc    Auto-expire pending request-mode bookings older than 24 hours
// Called periodically via setInterval in server.js
exports.autoExpirePendingBookings = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredBookings = await Booking.find({
      status: { $in: ['pending', 'pending_vendor_approval'] },
      bookingMode: 'request',
      createdAt: { $lte: twentyFourHoursAgo },
    });

    for (const booking of expiredBookings) {
      booking.status = 'expired';
      booking.statusHistory.push({
        status: 'expired',
        timestamp: new Date(),
        note: 'Auto-expired: vendor did not respond within 24 hours',
      });
      await booking.save();

      // Notify customer
      await Notification.create({
        user: booking.customer,
        type: 'booking_update',
        title: 'Booking Expired',
        message: 'Your booking request expired because the vendor did not respond within 24 hours.',
        relatedBooking: booking._id,
        actionUrl: `/bookings/${booking._id}`,
      });

      // Notify vendor
      await Notification.create({
        user: booking.vendor,
        type: 'booking_update',
        title: 'Booking Auto-Expired',
        message: `Booking ${booking.bookingId} auto-expired due to no response within 24 hours.`,
        relatedBooking: booking._id,
        actionUrl: `/vendor/bookings`,
      });
    }

    if (expiredBookings.length > 0) {
      console.log(`Auto-expired ${expiredBookings.length} pending booking(s)`);
    }
  } catch (error) {
    console.error('Auto-expire bookings error:', error);
  }
};
