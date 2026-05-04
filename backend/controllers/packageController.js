const RoutePackage = require('../models/RoutePackage');
const User = require('../models/User');

// GET /api/packages
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await RoutePackage.find({ active: true }).sort({ createdAt: -1 });
    res.json({ packages });
  } catch (err) {
    next(err);
  }
};

// GET /api/packages/:id/offers
exports.getPackageOffers = async (req, res, next) => {
  try {
    const pkg = await RoutePackage.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Find verified vendors
    const vendors = await User.find({ role: 'vendor', 'vendorDetails.isVerified': true }).lean();

    // Basic matching: prefer vendors whose businessAddress mentions origin or destination
    const originRegex = new RegExp(pkg.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const destRegex = new RegExp(pkg.destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const offers = vendors.map((v) => {
      const address = (v.vendorDetails && v.vendorDetails.businessAddress) || '';
      const proximityScore = originRegex.test(address) || destRegex.test(address) ? 0.9 : 1.1;
      const mid = (pkg.priceMin + pkg.priceMax) / 2;
      const variance = (Math.random() - 0.5) * 0.1; // +/-5%
      const price = Math.round(mid * proximityScore * (1 + variance));

      return {
        vendorId: v._id,
        vendorName: v.vendorDetails?.businessName || v.name,
        contactPhone: v.phone,
        businessAddress: v.vendorDetails?.businessAddress || '',
        recommendedVehicleTypes: pkg.recommendedVehicleTypes || [],
        priceEstimated: price,
        rating: v.averageRating || 0,
      };
    });

    // Sort offers by priceEstimated asc
    offers.sort((a, b) => a.priceEstimated - b.priceEstimated);

    res.json({ package: pkg, offers });
  } catch (err) {
    next(err);
  }
};
