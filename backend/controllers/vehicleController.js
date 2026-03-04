const Vehicle = require('../models/Vehicle');
const { checkWishlistPriceDrops, checkWishlistAvailability } = require('../utils/notificationService');

/**
 * Minimal Vehicle Controller — Provides the update endpoint needed to wire
 * Tasfy's notification service (Feature 7) to vehicle changes.
 *
 * The full CRUD for vehicles is Homyra's responsibility (Feature 2).
 * This controller focuses only on the update path that triggers wishlist
 * notifications for price drops and availability changes.
 */

// @desc    Update a vehicle (vendor only) — also triggers wishlist notifications
// @route   PUT /api/vehicles/:id
// @access  Private (vendor)
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Ensure the requesting vendor owns this vehicle
    if (vehicle.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    // Capture old values before update
    const oldPrice = vehicle.pricing?.dailyRate;
    const wasAvailable = vehicle.isAvailable;

    // Apply updates
    const allowedFields = [
      'make', 'model', 'year', 'vehicleType', 'description',
      'photos', 'features', 'registration', 'pricing',
      'location', 'rentalMode', 'isAvailable',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    const updatedVehicle = await vehicle.save();
    const vehicleName = `${updatedVehicle.make} ${updatedVehicle.model} ${updatedVehicle.year}`;

    // --- Wishlist notification triggers (Feature 7 wiring) ---

    // Price drop notification
    const newPrice = updatedVehicle.pricing?.dailyRate;
    if (oldPrice && newPrice && newPrice < oldPrice) {
      await checkWishlistPriceDrops(
        updatedVehicle._id,
        vehicleName,
        oldPrice,
        newPrice
      );
    }

    // Availability notification (vehicle was unavailable, now available)
    if (!wasAvailable && updatedVehicle.isAvailable) {
      await checkWishlistAvailability(
        updatedVehicle._id,
        vehicleName
      );
    }

    res.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all vehicles (public)
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const { city, vehicleType, minPrice, maxPrice, available } = req.query;
    const filter = { isApproved: true };

    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (vehicleType) filter.vehicleType = vehicleType;
    if (available !== undefined) filter.isAvailable = available === 'true';
    if (minPrice || maxPrice) {
      filter['pricing.dailyRate'] = {};
      if (minPrice) filter['pricing.dailyRate'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.dailyRate'].$lte = Number(maxPrice);
    }

    const vehicles = await Vehicle.find(filter)
      .populate('vendor', 'name email vendorDetails.businessName vendorDetails.isVerified')
      .sort({ createdAt: -1 });

    res.json({ count: vehicles.length, vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('vendor', 'name email phone vendorDetails');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  updateVehicle,
};
