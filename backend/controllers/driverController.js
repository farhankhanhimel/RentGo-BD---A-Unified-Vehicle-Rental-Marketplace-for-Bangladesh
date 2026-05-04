const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');
const { notifyEmergencyBooking } = require('../services/emergencyNotificationService');
const { emitToAdmins, emitToCustomer, emitToVendor } = require('../services/socketService');
const { createNotification } = require('../services/notificationService');

const toLanguagesArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const scoreLocationMatch = (bookingLocation, vendorAddress) => {
  const bookingTokens = new Set(normalizeText(bookingLocation));
  const vendorTokens = normalizeText(vendorAddress);

  if (!bookingTokens.size || !vendorTokens.length) {
    return 0;
  }

  return vendorTokens.reduce((score, token) => (bookingTokens.has(token) ? score + 1 : score), 0);
};

const isVendorNearby = (booking, vendor) => {
  if (!booking.pickupLocation) {
    return true;
  }

  const businessAddress = vendor?.vendorDetails?.businessAddress || '';
  return scoreLocationMatch(booking.pickupLocation, businessAddress) > 0;
};

const populateBooking = (bookingQuery) =>
  bookingQuery
    .populate('preferredVendor', 'name vendorDetails.businessName')
    .populate('assignedDriver', 'fullName averageRating photoUrl')
    .populate('customer', 'name phone')
    .populate('vendor', 'name vendorDetails.businessName');

exports.createDriver = async (req, res) => {
  try {
    const {
      fullName,
      photoUrl,
      nidNumber,
      licenseNumber,
      licenseExpiry,
      experienceYears,
      languages,
    } = req.body;

    if (
      !fullName ||
      !photoUrl ||
      !nidNumber ||
      !licenseNumber ||
      !licenseExpiry ||
      experienceYears === undefined
    ) {
      return res.status(400).json({ message: 'Please provide all required driver fields' });
    }

    const driver = await Driver.create({
      vendor: req.user._id,
      fullName,
      photoUrl,
      nidNumber,
      licenseNumber,
      licenseExpiry,
      experienceYears: Number(experienceYears),
      languages: toLanguagesArray(languages),
    });

    return res.status(201).json({
      message: 'Driver added successfully',
      driver,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getVendorDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ vendor: req.user._id }).sort({ createdAt: -1 });
    return res.json(drivers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, vendor: req.user._id });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const updates = req.body;

    if (updates.languages !== undefined) {
      updates.languages = toLanguagesArray(updates.languages);
    }

    Object.assign(driver, updates);
    await driver.save();

    return res.json({
      message: 'Driver updated successfully',
      driver,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findOneAndDelete({ _id: req.params.id, vendor: req.user._id });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    await Booking.updateMany(
      { assignedDriver: driver._id },
      { $set: { assignedDriver: null } }
    );

    return res.json({ message: 'Driver removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const {
      vendorId,
      vehicleName,
      withDriver,
      assignedDriverId,
      pickupDate,
      totalAmount,
      pickupLocation,
      isEmergency,
      emergencyNotes,
      preferredVendorId,
    } = req.body;

    if (!vehicleName || !pickupDate) {
      return res.status(400).json({ message: 'vehicleName and pickupDate are required' });
    }

    let vendor = null;
    if (vendorId) {
      vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
    } else if (!isEmergency) {
      return res.status(400).json({ message: 'vendorId is required' });
    }

    let preferredVendor = null;
    if (preferredVendorId) {
      preferredVendor = await User.findOne({ _id: preferredVendorId, role: 'vendor' });
      if (!preferredVendor) {
        return res.status(404).json({ message: 'Preferred vendor not found' });
      }
    } else if (vendor) {
      preferredVendor = vendor;
    }

    const emergencyFlag = Boolean(isEmergency);
    const driverVendorId = vendor?._id || preferredVendor?._id || vendorId;

    let assignedDriver = null;
    if (withDriver && assignedDriverId) {
      const driver = await Driver.findOne({ _id: assignedDriverId, vendor: driverVendorId, isActive: true });
      if (!driver) {
        return res.status(404).json({ message: 'Selected driver is unavailable' });
      }
      assignedDriver = driver._id;
    }

    const booking = await Booking.create({
      customer: req.user._id,
      vendor: emergencyFlag ? null : vendorId,
      preferredVendor: preferredVendor?._id || null,
      vehicleName,
      pickupLocation: pickupLocation || '',
      withDriver: Boolean(withDriver),
      assignedDriver,
      pickupDate,
      totalAmount: Number(totalAmount || 0),
      paymentStatus: 'unpaid',
      isEmergency: emergencyFlag,
      emergencyStatus: emergencyFlag ? 'queued' : 'queued',
      emergencyNotes: emergencyNotes || '',
      responseDueAt: emergencyFlag ? new Date(Date.now() + 30 * 60 * 1000) : null,
    });

    if (booking.isEmergency) {
      await notifyEmergencyBooking(booking._id);
    } else {
      // notify vendor of a new booking request if vendor assigned
      if (vendor) {
        await createNotification(vendor._id, 'new_booking', 'New booking request', `A new booking for ${vehicleName} was created`, { bookingId: booking._id, customerId: req.user._id, vendorId: vendor._id });
        emitToVendor(vendor._id, 'booking:new', { bookingId: booking._id });
      }
    }

    const populated = await populateBooking(Booking.findById(booking._id));

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('preferredVendor', 'name vendorDetails.businessName')
      .populate('vendor', 'name vendorDetails.businessName')
      .populate('assignedDriver', 'fullName averageRating')
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getVendorBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ vendor: req.user._id })
      .populate('preferredVendor', 'name vendorDetails.businessName')
      .populate('assignedDriver', 'fullName averageRating photoUrl')
      .populate('customer', 'name phone')
      .sort({ isEmergency: -1, createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getEmergencyBookingsForVendor = async (req, res) => {
  try {
    const vendor = await User.findById(req.user._id).select('vendorDetails.businessAddress');
    const bookings = await Booking.find({
      isEmergency: true,
      emergencyStatus: { $in: ['queued', 'broadcast', 'escalated'] },
      $or: [{ vendor: null }, { vendor: req.user._id }],
    })
      .populate('preferredVendor', 'name vendorDetails.businessName')
      .populate('customer', 'name phone')
      .sort({ responseDueAt: 1, createdAt: -1 });

    const filteredBookings = bookings.filter((booking) => isVendorNearby(booking, vendor));

    return res.json(filteredBookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getEmergencyBookingsForAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find({
      isEmergency: true,
      emergencyStatus: { $in: ['queued', 'broadcast', 'claimed', 'escalated'] },
    })
      .populate('preferredVendor', 'name vendorDetails.businessName')
      .populate('vendor', 'name vendorDetails.businessName')
      .populate('customer', 'name phone')
      .sort({ responseDueAt: 1, createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.claimEmergencyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      isEmergency: true,
      emergencyStatus: { $in: ['queued', 'broadcast', 'escalated'] },
      $or: [{ vendor: null }, { vendor: req.user._id }],
    });

    if (!booking) {
      return res.status(404).json({ message: 'Emergency booking not found or already claimed' });
    }

    booking.vendor = req.user._id;
    booking.emergencyStatus = 'claimed';
    booking.emergencyClaimedAt = new Date();
    booking.status = 'pending';
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    emitToCustomer(booking.customer, 'emergency:claimed', {
      bookingId: booking._id,
      vendorId: req.user._id,
      emergencyStatus: booking.emergencyStatus,
    });

    emitToAdmins('emergency:claimed', {
      bookingId: booking._id,
      vendorId: req.user._id,
      emergencyStatus: booking.emergencyStatus,
    });

    emitToVendor(req.user._id, 'emergency:claimed', {
      bookingId: booking._id,
      emergencyStatus: booking.emergencyStatus,
    });

    return res.json({
      message: 'Emergency booking claimed successfully',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.assignDriverToBooking = async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ message: 'driverId is required' });
    }

    const booking = await Booking.findOne({ _id: req.params.bookingId, vendor: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const driver = await Driver.findOne({ _id: driverId, vendor: req.user._id, isActive: true });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found or inactive' });
    }

    booking.assignedDriver = driver._id;
    booking.withDriver = true;
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('assignedDriver', 'fullName averageRating photoUrl')
      .populate('customer', 'name phone');

    return res.json({
      message: 'Driver assigned to booking',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addDriverRating = async (req, res) => {
  try {
    const { score, comment } = req.body;

    if (!score || Number(score) < 1 || Number(score) > 5) {
      return res.status(400).json({ message: 'Score must be between 1 and 5' });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.ratings.push({
      score: Number(score),
      comment,
      reviewer: req.user._id,
    });
    driver.recalculateRating();

    await driver.save();

    // notify vendor about new review
    try {
      await createNotification(driver.vendor, 'new_review', 'New driver review', `A customer left a review for driver ${driver.fullName}`, { driverId: driver._id, vendorId: driver.vendor });
      emitToVendor(driver.vendor, 'review:new', { driverId: driver._id, score: Number(score) });
    } catch (e) {
      // ignore notification errors
    }

    return res.status(201).json({
      message: 'Driver rated successfully',
      averageRating: driver.averageRating,
      ratingsCount: driver.ratings.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getVehicleDriverRatings = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.json([]);
    }

    const drivers = await Driver.find({ vendor: vendorId, isActive: true })
      .select('fullName photoUrl languages experienceYears averageRating ratings')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(6);

    const payload = drivers.map((driver) => ({
      _id: driver._id,
      fullName: driver.fullName,
      photoUrl: driver.photoUrl,
      languages: driver.languages,
      experienceYears: driver.experienceYears,
      averageRating: driver.averageRating,
      ratingsCount: driver.ratings.length,
    }));

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
