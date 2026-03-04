const Wishlist = require('../models/Wishlist');
const Vehicle = require('../models/Vehicle');

// @desc    Add a vehicle to wishlist
// @route   POST /api/wishlist
// @access  Private (Customer)
exports.addToWishlist = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ message: 'Vehicle ID is required' });
    }

    // Check vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check for duplicate
    const existing = await Wishlist.findOne({
      user: req.user._id,
      vehicle: vehicleId,
    });

    if (existing) {
      return res.status(400).json({ message: 'Vehicle already in your wishlist' });
    }

    const wishlistItem = await Wishlist.create({
      user: req.user._id,
      vehicle: vehicleId,
      priceAtSave: vehicle.pricing.dailyRate,
    });

    res.status(201).json({
      message: 'Vehicle added to wishlist',
      wishlistItem,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove a vehicle from wishlist
// @route   DELETE /api/wishlist/:vehicleId
// @access  Private (Customer)
exports.removeFromWishlist = async (req, res) => {
  try {
    const result = await Wishlist.findOneAndDelete({
      user: req.user._id,
      vehicle: req.params.vehicleId,
    });

    if (!result) {
      return res.status(404).json({ message: 'Vehicle not found in wishlist' });
    }

    res.json({ message: 'Vehicle removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's full wishlist
// @route   GET /api/wishlist
// @access  Private (Customer)
exports.getWishlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const total = await Wishlist.countDocuments({ user: req.user._id });

    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate({
        path: 'vehicle',
        populate: {
          path: 'vendor',
          select: 'name vendorDetails.businessName vendorDetails.isVerified vendorDetails.verificationBadge',
        },
      })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compute price changes
    const enrichedWishlist = wishlist.map((item) => {
      const currentPrice = item.vehicle?.pricing?.dailyRate || 0;
      const savedPrice = item.priceAtSave || 0;
      const priceDifference = currentPrice - savedPrice;

      return {
        _id: item._id,
        vehicle: item.vehicle,
        priceAtSave: item.priceAtSave,
        currentPrice,
        priceChanged: priceDifference !== 0,
        priceDifference,
        addedAt: item.addedAt,
        notifyOnPriceDrop: item.notifyOnPriceDrop,
        notifyOnAvailability: item.notifyOnAvailability,
      };
    });

    res.json({
      wishlist: enrichedWishlist,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if a vehicle is in the user's wishlist
// @route   GET /api/wishlist/check/:vehicleId
// @access  Private (Customer)
exports.checkWishlist = async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      user: req.user._id,
      vehicle: req.params.vehicleId,
    });

    res.json({ isWishlisted: !!item });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update wishlist notification preferences
// @route   PUT /api/wishlist/:vehicleId/preferences
// @access  Private (Customer)
exports.updatePreferences = async (req, res) => {
  try {
    const { notifyOnPriceDrop, notifyOnAvailability } = req.body;

    const item = await Wishlist.findOneAndUpdate(
      { user: req.user._id, vehicle: req.params.vehicleId },
      {
        ...(notifyOnPriceDrop !== undefined && { notifyOnPriceDrop }),
        ...(notifyOnAvailability !== undefined && { notifyOnAvailability }),
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Vehicle not found in wishlist' });
    }

    res.json({ message: 'Preferences updated', item });
  } catch (error) {
    console.error('Update wishlist preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
