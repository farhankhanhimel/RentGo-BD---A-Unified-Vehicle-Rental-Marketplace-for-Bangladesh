const mongoose = require('mongoose');
const RoutePackage = require('../models/RoutePackage');
const Vehicle = require('../models/Vehicle');

const defaultPackages = [
  {
    routeName: "Dhaka-Cox's Bazar",
    origin: 'Dhaka',
    destination: "Cox's Bazar",
    priceMin: 8500,
    priceMax: 15000,
    recommendedVehicleTypes: ['microbus', 'van', 'car'],
  },
  {
    routeName: 'Dhaka-Sylhet',
    origin: 'Dhaka',
    destination: 'Sylhet',
    priceMin: 6500,
    priceMax: 12000,
    recommendedVehicleTypes: ['car', 'microbus', 'van'],
  },
  {
    routeName: 'Dhaka-Chittagong',
    origin: 'Dhaka',
    destination: 'Chittagong',
    priceMin: 7000,
    priceMax: 13000,
    recommendedVehicleTypes: ['car', 'microbus', 'van'],
  },
  {
    routeName: 'Dhaka-Rajshahi',
    origin: 'Dhaka',
    destination: 'Rajshahi',
    priceMin: 6500,
    priceMax: 11500,
    recommendedVehicleTypes: ['car', 'microbus', 'van'],
  },
];

const getFallbackPackages = () => defaultPackages.map((pkg, index) => ({
  _id: `default-${index + 1}`,
  ...pkg,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

exports.getRoutePackages = async (req, res) => {
  try {
    const packages = await RoutePackage.find({ active: true }).sort({ createdAt: -1 });
    return res.json(packages.length ? packages : getFallbackPackages());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getRoutePackageDetail = async (req, res) => {
  try {
    const packageDoc = mongoose.isValidObjectId(req.params.id)
      ? await RoutePackage.findById(req.params.id)
      : null;
    if (!packageDoc) {
      const fallback = getFallbackPackages().find((item) => item._id === req.params.id);
      if (!fallback) return res.status(404).json({ message: 'Route package not found' });
      return res.json(fallback);
    }

    return res.json(packageDoc);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getRoutePackageOffers = async (req, res) => {
  try {
    const packageDoc = mongoose.isValidObjectId(req.params.id)
      ? await RoutePackage.findById(req.params.id)
      : null;
    const routePackage = packageDoc || getFallbackPackages().find((item) => item._id === req.params.id);

    if (!routePackage) {
      return res.status(404).json({ message: 'Route package not found' });
    }

    const vehicleQuery = {
      isApproved: true,
      isAvailable: true,
      'location.city': new RegExp(routePackage.origin, 'i'),
    };

    if (routePackage.recommendedVehicleTypes?.length) {
      vehicleQuery.vehicleType = { $in: routePackage.recommendedVehicleTypes };
    }

    const vehicles = await Vehicle.find(vehicleQuery)
      .populate('vendor', 'name email vendorDetails.businessName vendorDetails.isVerified')
      .sort({ 'pricing.dailyRate': 1, 'rating.average': -1 });

    const offers = vehicles.map((vehicle) => ({
      _id: vehicle._id,
      vehicleName: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
      vendor: vehicle.vendor,
      vehicleType: vehicle.vehicleType,
      rentalMode: vehicle.rentalMode,
      dailyRate: vehicle.pricing?.dailyRate || 0,
      hourlyRate: vehicle.pricing?.hourlyRate || 0,
      rating: vehicle.rating?.average || 0,
      seats: vehicle.features?.seats || null,
      ac: vehicle.features?.ac || false,
      transmission: vehicle.features?.transmission || '',
      fuelType: vehicle.features?.fuelType || '',
      photos: vehicle.photos || [],
      routeRange: {
        min: routePackage.priceMin,
        max: routePackage.priceMax,
      },
    }));

    return res.json({
      routePackage,
      offers,
      totalOffers: offers.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
