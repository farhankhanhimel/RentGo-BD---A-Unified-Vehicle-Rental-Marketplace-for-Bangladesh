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
  description: 'Platform suggested route. Select the route to compare matching vendor vehicles.',
  inclusions: ['Vendor vehicle comparison', 'Route-based package range', 'Booking request support'],
  pickupPoints: [pkg.origin],
  dropPoints: [pkg.destination],
  durationDays: 1,
  maxPassengers: 4,
  withDriver: true,
  returnTripAvailable: true,
  fuelIncluded: false,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const parseList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

const buildPackagePayload = (body) => ({
  routeName: body.routeName,
  origin: body.origin,
  destination: body.destination,
  vehicle: body.vehicle || undefined,
  description: body.description || '',
  priceMin: Number(body.priceMin),
  priceMax: Number(body.priceMax || body.priceMin),
  recommendedVehicleTypes: parseList(body.recommendedVehicleTypes),
  inclusions: parseList(body.inclusions),
  pickupPoints: parseList(body.pickupPoints),
  dropPoints: parseList(body.dropPoints),
  durationDays: Number(body.durationDays || 1),
  maxPassengers: Number(body.maxPassengers || 4),
  withDriver: body.withDriver !== false,
  returnTripAvailable: Boolean(body.returnTripAvailable),
  fuelIncluded: Boolean(body.fuelIncluded),
  active: body.active !== false,
});

const packagePopulate = [
  { path: 'vendor', select: 'name email phone vendorDetails.businessName vendorDetails.isVerified avatar' },
  { path: 'vehicle', select: 'make model year vehicleType photos pricing features rentalMode location rating isApproved isAvailable' },
];

exports.getRoutePackages = async (req, res) => {
  try {
    const {
      origin,
      destination,
      vehicleType,
      minPrice,
      maxPrice,
      search,
      withDriver,
      passengers,
    } = req.query;

    const query = { active: true };
    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (vehicleType) query.recommendedVehicleTypes = vehicleType;
    if (withDriver !== undefined) query.withDriver = withDriver === 'true';
    if (passengers) query.maxPassengers = { $gte: Number(passengers) };
    if (minPrice || maxPrice) {
      query.priceMin = {};
      if (minPrice) query.priceMin.$gte = Number(minPrice);
      if (maxPrice) query.priceMin.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { routeName: new RegExp(search, 'i') },
        { origin: new RegExp(search, 'i') },
        { destination: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const packages = await RoutePackage.find(query).populate(packagePopulate).sort({ createdAt: -1 });
    return res.json(packages.length ? packages : getFallbackPackages());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createRoutePackage = async (req, res) => {
  try {
    const payload = buildPackagePayload(req.body);

    if (!payload.routeName || !payload.origin || !payload.destination || !payload.priceMin) {
      return res.status(400).json({ message: 'Route name, origin, destination, and starting price are required' });
    }

    if (payload.priceMax < payload.priceMin) {
      return res.status(400).json({ message: 'Maximum price cannot be lower than minimum price' });
    }

    if (payload.vehicle) {
      const vehicle = await Vehicle.findOne({ _id: payload.vehicle, vendor: req.user._id });
      if (!vehicle) {
        return res.status(404).json({ message: 'Selected vehicle was not found in your fleet' });
      }
      if (!payload.recommendedVehicleTypes.length) {
        payload.recommendedVehicleTypes = [vehicle.vehicleType];
      }
      payload.maxPassengers = payload.maxPassengers || vehicle.features?.seats || 4;
    }

    const routePackage = await RoutePackage.create({
      ...payload,
      vendor: req.user._id,
    });

    const populated = await RoutePackage.findById(routePackage._id).populate(packagePopulate);
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMyRoutePackages = async (req, res) => {
  try {
    const packages = await RoutePackage.find({ vendor: req.user._id })
      .populate(packagePopulate)
      .sort({ createdAt: -1 });
    return res.json({ packages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateRoutePackage = async (req, res) => {
  try {
    const routePackage = await RoutePackage.findOne({ _id: req.params.id, vendor: req.user._id });
    if (!routePackage) {
      return res.status(404).json({ message: 'Route package not found' });
    }

    const payload = buildPackagePayload(req.body);
    if (payload.vehicle) {
      const vehicle = await Vehicle.findOne({ _id: payload.vehicle, vendor: req.user._id });
      if (!vehicle) {
        return res.status(404).json({ message: 'Selected vehicle was not found in your fleet' });
      }
    }

    Object.assign(routePackage, payload);
    await routePackage.save();

    const populated = await RoutePackage.findById(routePackage._id).populate(packagePopulate);
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteRoutePackage = async (req, res) => {
  try {
    const routePackage = await RoutePackage.findOne({ _id: req.params.id, vendor: req.user._id });
    if (!routePackage) {
      return res.status(404).json({ message: 'Route package not found' });
    }

    await RoutePackage.deleteOne({ _id: routePackage._id });
    return res.json({ message: 'Route package deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getRoutePackageDetail = async (req, res) => {
  try {
    const packageDoc = mongoose.isValidObjectId(req.params.id)
      ? await RoutePackage.findById(req.params.id).populate(packagePopulate)
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
      ? await RoutePackage.findById(req.params.id).populate(packagePopulate)
      : null;
    const routePackage = packageDoc || getFallbackPackages().find((item) => item._id === req.params.id);

    if (!routePackage) {
      return res.status(404).json({ message: 'Route package not found' });
    }

    const vehicleQuery = routePackage.vehicle
      ? { _id: routePackage.vehicle._id || routePackage.vehicle, isApproved: true, isAvailable: true }
      : {
        isApproved: true,
        isAvailable: true,
        'location.city': new RegExp(routePackage.origin, 'i'),
      };

    if (!routePackage.vehicle && routePackage.vendor) {
      vehicleQuery.vendor = routePackage.vendor._id || routePackage.vendor;
    }

    if (!routePackage.vehicle && routePackage.recommendedVehicleTypes?.length) {
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
      driverSurcharge: vehicle.pricing?.driverSurcharge || 0,
      fuelPolicy: vehicle.pricing?.fuelPolicy || 'excluded',
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
      packagePrice: routePackage.priceMin,
      packageId: routePackage._id,
      packageName: routePackage.routeName,
      packageDurationDays: routePackage.durationDays || 1,
      packageMaxPassengers: routePackage.maxPassengers || vehicle.features?.seats || null,
      packageWithDriver: Boolean(routePackage.withDriver),
      packageInclusions: routePackage.inclusions || [],
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
