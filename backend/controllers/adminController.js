const User = require('../models/User');
const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');
const PlatformConfig = require('../models/PlatformConfig');

// Users list (with optional role filter)
exports.listUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password -otp');

    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) {
    next(err);
  }
};

// Update user (edit fields, ban/unban)
exports.updateUser = async (req, res, next) => {
  try {
    const updates = req.body;
    delete updates.password; // don't allow password changes here
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password -otp');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// Pending vendors
exports.listPendingVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({ role: 'vendor', 'vendorDetails.isVerified': false }).select('-password -otp');
    res.json({ vendors });
  } catch (err) {
    next(err);
  }
};

// Verify vendor
exports.verifyVendor = async (req, res, next) => {
  try {
    const { approve } = req.body;
    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== 'vendor') return res.status(404).json({ message: 'Vendor not found' });
    vendor.vendorDetails = vendor.vendorDetails || {};
    vendor.vendorDetails.isVerified = !!approve;
    await vendor.save();
    // notify vendor about approval/rejection
    try {
      const { createNotification } = require('../services/notificationService');
      const { emitToVendor } = require('../services/socketService');
      const title = approve ? 'Vendor approved' : 'Vendor verification rejected';
      const body = approve ? 'Your vendor account has been approved' : 'Your vendor verification was rejected. Please review your documents.';
      await createNotification(vendor._id, 'vendor_verification', title, body, { vendorId: vendor._id, approved: !!approve });
      emitToVendor(vendor._id, 'vendor:verification', { approved: !!approve });
    } catch (e) {
      // ignore
    }

    res.json({ vendor });
  } catch (err) {
    next(err);
  }
};

// Disputes
exports.listDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find().populate('booking raisedBy vendor').sort({ createdAt: -1 });
    res.json({ disputes });
  } catch (err) {
    next(err);
  }
};

exports.updateDispute = async (req, res, next) => {
  try {
    const updates = req.body;
    const dispute = await Dispute.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('booking raisedBy vendor');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    res.json({ dispute });
  } catch (err) {
    next(err);
  }
};

// Platform config (commission)
exports.getConfig = async (req, res, next) => {
  try {
    const item = await PlatformConfig.findOne({ key: 'commission' });
    res.json({ commission: item ? item.value : { percent: 10 } });
  } catch (err) {
    next(err);
  }
};

exports.setConfig = async (req, res, next) => {
  try {
    const { percent } = req.body;
    let item = await PlatformConfig.findOne({ key: 'commission' });
    if (!item) item = new PlatformConfig({ key: 'commission', value: { percent: Number(percent || 10) } });
    else item.value = { percent: Number(percent || 10) };
    await item.save();
    res.json({ commission: item.value });
  } catch (err) {
    next(err);
  }
};

// Analytics
exports.analytics = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

    const totalRevenueAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } },
    ]);

    const vehicleAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$vehicleName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const routeAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$pickupLocation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const activeUsers = await User.countDocuments({ updatedAt: { $gte: since } });

    res.json({
      totalRevenue: totalRevenueAgg[0]?.totalRevenue || 0,
      bookings: totalRevenueAgg[0]?.bookings || 0,
      topVehicleTypes: vehicleAgg,
      topRoutes: routeAgg,
      activeUsers,
    });
  } catch (err) {
    next(err);
  }
};
