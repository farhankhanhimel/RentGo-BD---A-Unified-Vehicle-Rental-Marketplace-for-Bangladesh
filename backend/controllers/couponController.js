const Coupon = require('../models/Coupon');
const { validateCoupon } = require('../utils/couponValidator');

/**
 * Coupon Controller
 * Feature 18 — Tasfy
 */

// @desc    Create a coupon (vendor creates own, admin creates platform-wide)
// @route   POST /api/coupons
// @access  Private/Vendor or Admin
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      applicableVehicleTypes,
      applicableTripTypes,
      usageLimit,
      perUserLimit,
      startDate,
      endDate,
    } = req.body;

    // Validate code uniqueness
    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Percentage discount max validation
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    // Date validation
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const couponData = {
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue,
      maxDiscount: discountType === 'percentage' ? maxDiscount : null,
      minOrderAmount: minOrderAmount || 0,
      applicableVehicleTypes: applicableVehicleTypes || [],
      applicableTripTypes: applicableTripTypes || [],
      usageLimit: usageLimit || null,
      perUserLimit: perUserLimit || 1,
      startDate,
      endDate,
      createdBy: req.user._id,
    };

    // If vendor, assign to vendor
    if (req.user.role === 'vendor') {
      couponData.vendor = req.user._id;
    }

    const coupon = await Coupon.create(couponData);

    res.status(201).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(500).json({ message: 'Server error creating coupon' });
  }
};

// @desc    Get coupons (vendor sees own, admin sees all)
// @route   GET /api/coupons
// @access  Private/Vendor or Admin
exports.getCoupons = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // Vendor only sees own coupons
    if (req.user.role === 'vendor') {
      query.vendor = req.user._id;
    }

    if (status === 'active') {
      query.isActive = true;
      query.endDate = { $gte: new Date() };
    } else if (status === 'expired') {
      query.endDate = { $lt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.code = new RegExp(search, 'i');
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .populate('vendor', 'name vendorDetails.businessName')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      coupons,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Owner or Admin
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Authorization
    if (
      req.user.role !== 'admin' &&
      coupon.vendor?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = req.body;
    if (updates.code) updates.code = updates.code.toUpperCase().trim();

    // Don't allow changing code to existing one
    if (updates.code && updates.code !== coupon.code) {
      const exists = await Coupon.findOne({ code: updates.code, _id: { $ne: coupon._id } });
      if (exists) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }

    Object.assign(coupon, updates);
    await coupon.save();

    res.json(coupon);
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Owner or Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    if (
      req.user.role !== 'admin' &&
      coupon.vendor?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Coupon.deleteOne({ _id: coupon._id });

    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle coupon active/inactive
// @route   PUT /api/coupons/:id/toggle
// @access  Private/Owner or Admin
exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    if (
      req.user.role !== 'admin' &&
      coupon.vendor?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json(coupon);
  } catch (error) {
    console.error('Toggle coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Validate/apply a coupon (for customers during checkout)
// @route   POST /api/coupons/validate
// @access  Private/Customer
exports.validateCouponCode = async (req, res) => {
  try {
    const { code, orderAmount, vehicleType, tripType } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const result = await validateCoupon(
      code,
      req.user._id,
      orderAmount || 0,
      vehicleType,
      tripType
    );

    if (!result.valid) {
      return res.status(400).json({ message: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get available coupons for customers
// @route   GET /api/coupons/available
// @access  Private/Customer
exports.getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
    })
      .select('code description discountType discountValue maxDiscount minOrderAmount applicableVehicleTypes applicableTripTypes endDate')
      .sort({ discountValue: -1 });

    // Filter by per-user limit
    const availableCoupons = coupons.filter((coupon) => {
      const userUsage = coupon.usedBy
        ? coupon.usedBy.filter((u) => u.user?.toString() === req.user._id.toString()).length
        : 0;
      return userUsage < (coupon.perUserLimit || 1);
    });

    res.json(availableCoupons);
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
