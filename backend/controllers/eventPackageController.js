const EventPackage = require('../models/EventPackage');
const PackageBooking = require('../models/PackageBooking');
const Notification = require('../models/Notification');

/**
 * Event Package Controller
 * Feature 17 — Tasfy
 */

// @desc    Create event package (vendor)
// @route   POST /api/event-packages
// @access  Private/Vendor
exports.createPackage = async (req, res) => {
  try {
    const packageData = {
      ...req.body,
      vendor: req.user._id,
    };

    const eventPackage = await EventPackage.create(packageData);

    res.status(201).json(eventPackage);
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ message: 'Server error creating package' });
  }
};

// @desc    Get all event packages (public, with filters)
// @route   GET /api/event-packages
// @access  Public
exports.getPackages = async (req, res) => {
  try {
    const {
      eventType,
      city,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true, isApproved: true };

    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }
    if (city) {
      query['coverageArea.cities'] = new RegExp(city, 'i');
    }
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await EventPackage.countDocuments(query);
    const packages = await EventPackage.find(query)
      .populate('vendor', 'name vendorDetails.businessName vendorDetails.isVerified avatar')
      .populate('vehicles.vehicle', 'make model year vehicleType photos')
      .sort(sortObj)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      packages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single package detail
// @route   GET /api/event-packages/:id
// @access  Public
exports.getPackageDetail = async (req, res) => {
  try {
    const eventPackage = await EventPackage.findById(req.params.id)
      .populate('vendor', 'name vendorDetails avatar phone email')
      .populate('vehicles.vehicle', 'make model year vehicleType photos features pricing');

    if (!eventPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json(eventPackage);
  } catch (error) {
    console.error('Get package detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vendor's own packages
// @route   GET /api/event-packages/my-packages
// @access  Private/Vendor
exports.getMyPackages = async (req, res) => {
  try {
    const packages = await EventPackage.find({ vendor: req.user._id })
      .populate('vehicles.vehicle', 'make model year vehicleType photos')
      .sort({ createdAt: -1 });

    res.json(packages);
  } catch (error) {
    console.error('Get my packages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update package
// @route   PUT /api/event-packages/:id
// @access  Private/Vendor (owner)
exports.updatePackage = async (req, res) => {
  try {
    const eventPackage = await EventPackage.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!eventPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    Object.assign(eventPackage, req.body);
    await eventPackage.save();

    res.json(eventPackage);
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete package
// @route   DELETE /api/event-packages/:id
// @access  Private/Vendor (owner) or Admin
exports.deletePackage = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.vendor = req.user._id;
    }

    const eventPackage = await EventPackage.findOne(query);
    if (!eventPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    await EventPackage.deleteOne({ _id: eventPackage._id });

    res.json({ message: 'Package deleted' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Book an event package (customer)
// @route   POST /api/event-packages/:id/book
// @access  Private/Customer
exports.bookPackage = async (req, res) => {
  try {
    const eventPackage = await EventPackage.findById(req.params.id);
    if (!eventPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (!eventPackage.isActive) {
      return res.status(400).json({ message: 'This package is currently unavailable' });
    }

    const { eventDetails, contactInfo, additionalCharges = 0 } = req.body;

    if (!eventDetails?.eventDate || !eventDetails?.startTime || !eventDetails?.location) {
      return res.status(400).json({ message: 'Event date, time, and location are required' });
    }

    if (!contactInfo?.name || !contactInfo?.phone) {
      return res.status(400).json({ message: 'Contact name and phone are required' });
    }

    const totalAmount =
      eventPackage.pricing.basePrice + additionalCharges;

    const packageBooking = await PackageBooking.create({
      package: eventPackage._id,
      customer: req.user._id,
      vendor: eventPackage.vendor,
      eventDetails,
      contactInfo,
      pricing: {
        packagePrice: eventPackage.pricing.basePrice,
        additionalCharges,
        totalAmount,
        deposit: eventPackage.pricing.deposit,
      },
    });

    // Update booking count
    eventPackage.bookingsCount += 1;
    await eventPackage.save();

    // Notify vendor
    await Notification.create({
      user: eventPackage.vendor,
      type: 'booking_confirmed',
      title: 'New Package Booking',
      message: `New booking for "${eventPackage.title}" on ${new Date(eventDetails.eventDate).toLocaleDateString()}`,
      relatedBooking: packageBooking._id,
      actionUrl: `/vendor/packages`,
    });

    res.status(201).json(packageBooking);
  } catch (error) {
    console.error('Book package error:', error);
    res.status(500).json({ message: 'Server error booking package' });
  }
};

// @desc    Get vendor's package bookings
// @route   GET /api/event-packages/bookings
// @access  Private/Vendor
exports.getPackageBookings = async (req, res) => {
  try {
    const bookings = await PackageBooking.find({ vendor: req.user._id })
      .populate('package', 'title eventType pricing.basePrice')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get package bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update package booking status
// @route   PUT /api/event-packages/bookings/:id/status
// @access  Private/Vendor
exports.updatePackageBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await PackageBooking.findOne({
      _id: req.params.id,
      vendor: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    // Notify customer
    const statusMessages = {
      confirmed: 'Your event package booking has been confirmed!',
      declined: 'Your event package booking was declined.',
      completed: 'Your event is marked as completed. Thank you!',
      cancelled: 'Your event package booking has been cancelled.',
    };

    if (statusMessages[status]) {
      await Notification.create({
        user: booking.customer,
        type: 'booking_update',
        title: `Package Booking ${status}`,
        message: statusMessages[status],
        relatedBooking: booking._id,
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Update package booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
