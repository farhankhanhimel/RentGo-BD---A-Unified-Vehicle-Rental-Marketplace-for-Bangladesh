const Vehicle = require('../models/Vehicle');
const { checkWishlistPriceDrops, checkWishlistAvailability } = require('../utils/notificationService');

const TRIP_TYPE_RECOMMENDATIONS = {
  tourism: {
    vehicleTypes: ['car', 'microbus', 'van', 'bus'],
    minSeats: 4,
    preferredRentalModes: ['with_driver', 'both'],
  },
  airport_transfer: {
    vehicleTypes: ['car', 'microbus', 'van'],
    minSeats: 3,
    preferredRentalModes: ['with_driver', 'both'],
  },
  wedding: {
    vehicleTypes: ['car', 'microbus', 'van', 'bus'],
    minSeats: 4,
    preferredRentalModes: ['with_driver', 'both'],
  },
  office: {
    vehicleTypes: ['car', 'microbus', 'van', 'pickup'],
    minSeats: 4,
    preferredRentalModes: ['self_drive', 'with_driver', 'both'],
  },
  emergency: {
    vehicleTypes: ['motorcycle', 'car', 'microbus'],
    minSeats: 1,
    preferredRentalModes: ['self_drive', 'with_driver', 'both'],
  },
};

const getRecommendationMeta = (tripType) => TRIP_TYPE_RECOMMENDATIONS[String(tripType || '').toLowerCase()] || null;

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
    const {
      city,
      district,
      vehicleType,
      minPrice,
      maxPrice,
      minHourly,
      maxHourly,
      transmission,
      fuelType,
      ac,
      seats,
      rentalMode,
      tripType,
      recommendedOnly,
      available,
      sort = 'newest', // price_asc, price_desc, rating, proximity, newest
      lat,
      lng,
      radius = 10, // km
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isApproved: true };

    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (district) filter['location.district'] = new RegExp(district, 'i');
    if (vehicleType) filter.vehicleType = vehicleType;
    if (available !== undefined) filter.isAvailable = available === 'true';

    // Price filters
    if (minPrice || maxPrice) {
      filter['pricing.dailyRate'] = {};
      if (minPrice) filter['pricing.dailyRate'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.dailyRate'].$lte = Number(maxPrice);
    }
    if (minHourly || maxHourly) {
      filter['pricing.hourlyRate'] = {};
      if (minHourly) filter['pricing.hourlyRate'].$gte = Number(minHourly);
      if (maxHourly) filter['pricing.hourlyRate'].$lte = Number(maxHourly);
    }

    // Feature filters
    if (transmission) filter['features.transmission'] = transmission;
    if (fuelType) filter['features.fuelType'] = fuelType;
    if (ac !== undefined) filter['features.ac'] = ac === 'true';
    if (seats) filter['features.seats'] = { $gte: Number(seats) };
    if (rentalMode) {
      // rentalMode can be self_drive, with_driver, both
      if (rentalMode === 'self_drive') {
        filter.rentalMode = { $in: ['self_drive', 'both'] };
      } else if (rentalMode === 'with_driver') {
        filter.rentalMode = { $in: ['with_driver', 'both'] };
      }
    }

    const recommendationMeta = getRecommendationMeta(tripType);
    if (recommendationMeta && recommendedOnly === 'true' && !vehicleType) {
      filter.vehicleType = { $in: recommendationMeta.vehicleTypes };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Base query
    let vehicles = await Vehicle.find(filter)
      .populate('vendor', 'name email vendorDetails.businessName vendorDetails.isVerified');

    // If coordinates provided, compute approximate distance and optionally filter by radius.
    const computeDistanceKm = (lat1, lon1, lat2, lon2) => {
      const toRad = (deg) => deg * (Math.PI / 180);
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    if (lat && lng) {
      const qLat = Number(lat);
      const qLng = Number(lng);
      vehicles = vehicles.map((v) => {
        const vLat = v.location?.coordinates?.lat || 0;
        const vLng = v.location?.coordinates?.lng || 0;
        const distance = computeDistanceKm(qLat, qLng, vLat, vLng);
        return { ...v.toObject(), distanceKm: distance };
      });

      // Filter by radius
      if (radius) {
        vehicles = vehicles.filter((v) => v.distanceKm <= Number(radius));
      }
    } else {
      vehicles = vehicles.map((v) => ({ ...v.toObject() }));
    }

    if (recommendationMeta) {
      vehicles = vehicles.map((v) => {
        let recommendationScore = 0;
        const seatsCount = Number(v.features?.seats || 0);

        if (recommendationMeta.vehicleTypes.includes(v.vehicleType)) recommendationScore += 3;
        if (seatsCount >= recommendationMeta.minSeats) recommendationScore += 1;
        if (recommendationMeta.preferredRentalModes.includes(v.rentalMode)) recommendationScore += 1;
        if (v.vendor?.vendorDetails?.isVerified) recommendationScore += 0.5;

        return {
          ...v,
          recommendationScore,
          isRecommendedForTrip: recommendationScore >= 3,
        };
      });

      if (recommendedOnly === 'true') {
        vehicles = vehicles.filter((v) => v.isRecommendedForTrip);
      }
    }

    // Sorting
    if (sort === 'price_asc') {
      vehicles.sort((a, b) => (a.pricing.dailyRate || 0) - (b.pricing.dailyRate || 0));
    } else if (sort === 'price_desc') {
      vehicles.sort((a, b) => (b.pricing.dailyRate || 0) - (a.pricing.dailyRate || 0));
    } else if (sort === 'rating') {
      vehicles.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    } else if (sort === 'proximity' && lat && lng) {
      vehicles.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else {
      // newest
      vehicles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (recommendationMeta) {
      vehicles.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
    }

    const total = vehicles.length;
    const paged = vehicles.slice(skip, skip + Number(limit));

    res.json({
      count: paged.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      tripType: tripType || null,
      recommendedVehicleTypes: recommendationMeta?.vehicleTypes || [],
      vehicles: paged,
    });
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

// @desc    Get vendor's own vehicles
// @route   GET /api/vehicles/my
// @access  Private (vendor)
const getVendorVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ vendor: req.user._id })
      .sort({ createdAt: -1 });

    const formattedVehicles = vehicles.map((vehicleDoc) => {
      const vehicle = vehicleDoc.toObject();
      const status = !vehicle.isAvailable
        ? 'deactivated'
        : vehicle.isApproved
          ? 'approved'
          : 'pending_approval';

      return {
        ...vehicle,
        status,
        specs: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          seats: vehicle.features?.seats,
          fuelType: vehicle.features?.fuelType,
          transmission: vehicle.features?.transmission,
          ac: vehicle.features?.ac,
          registrationNo: vehicle.registration?.number,
        },
        media: {
          photos: (vehicle.photos || []).map((photo) => (typeof photo === 'string' ? { url: photo } : photo)),
          primaryPhotoIndex: 0,
        },
        meta: {
          totalBookings: 0,
        },
      };
    });

    res.json({ vehicles: formattedVehicles });
  } catch (error) {
    console.error('Error fetching vendor vehicles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List pending vehicles for moderation
// @route   GET /api/vehicles/admin/pending
// @access  Private (admin)
const getPendingVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isApproved: false })
      .populate('vendor', 'name email phone vendorDetails.businessName vendorDetails.isVerified')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ vehicles });
  } catch (error) {
    console.error('Error fetching pending vehicles:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve a vehicle
// @route   PATCH /api/vehicles/:id/approve
// @access  Private (admin)
const adminApproveVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isAvailable: true },
      { new: true }
    ).populate('vendor', 'name email');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle approved', vehicle });
  } catch (error) {
    console.error('Error approving vehicle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject a vehicle
// @route   PATCH /api/vehicles/:id/reject
// @access  Private (admin)
const adminRejectVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, isAvailable: false },
      { new: true }
    ).populate('vendor', 'name email');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle rejected', vehicle, reason: req.body.reason || '' });
  } catch (error) {
    console.error('Error rejecting vehicle:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new vehicle (for testing/injection)
// @route   POST /api/vehicles
// @access  Public (temporarily for your presentation)
const addVehicle = async (req, res) => {
  try {
    const newVehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, vehicle: newVehicle });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(400).json({ message: 'Failed to add vehicle', error: error.message });
  }
};




module.exports = {
  getVehicles,
  getVehicle,
  getVendorVehicles,
  updateVehicle,
  getPendingVehicles,
  adminApproveVehicle,
  adminRejectVehicle,
  addVehicle,
};
