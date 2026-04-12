const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');

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
    const { vendorId, vehicleName, withDriver, assignedDriverId, pickupDate } = req.body;

    if (!vendorId || !vehicleName || !pickupDate) {
      return res.status(400).json({ message: 'vendorId, vehicleName and pickupDate are required' });
    }

    const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    let assignedDriver = null;
    if (withDriver && assignedDriverId) {
      const driver = await Driver.findOne({ _id: assignedDriverId, vendor: vendorId, isActive: true });
      if (!driver) {
        return res.status(404).json({ message: 'Selected driver is unavailable' });
      }
      assignedDriver = driver._id;
    }

    const booking = await Booking.create({
      customer: req.user._id,
      vendor: vendorId,
      vehicleName,
      withDriver: Boolean(withDriver),
      assignedDriver,
      pickupDate,
    });

    const populated = await Booking.findById(booking._id)
      .populate('assignedDriver', 'fullName averageRating photoUrl')
      .populate('customer', 'name phone')
      .populate('vendor', 'name vendorDetails.businessName');

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getVendorBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ vendor: req.user._id })
      .populate('assignedDriver', 'fullName averageRating photoUrl')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    return res.json(bookings);
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
