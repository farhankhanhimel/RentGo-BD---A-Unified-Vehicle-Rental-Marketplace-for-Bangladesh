const mongoose = require('mongoose');
const IntercityRequest = require('../models/IntercityRequest');
const RoutePackage = require('../models/RoutePackage');
const Vehicle = require('../models/Vehicle');

const populateRequest = (query) => query
  .populate('customer', 'name email phone')
  .populate('acceptedVendor', 'name email phone vendorDetails.businessName')
  .populate('offers.vendor', 'name email phone vendorDetails.businessName vendorDetails.isVerified')
  .populate('offers.routePackage', 'routeName origin destination priceMin priceMax inclusions withDriver returnTripAvailable fuelIncluded')
  .populate('offers.vehicle', 'make model year vehicleType photos pricing features rentalMode location')
  .populate('messages.sender', 'name role avatar')
  .populate('messages.vendor', 'name vendorDetails.businessName');

const userCanAccessRequest = (request, user) => {
  if (!request || !user) return false;
  if (request.customer?._id?.toString() === user._id.toString() || request.customer?.toString() === user._id.toString()) {
    return true;
  }
  if (user.role === 'vendor') {
    return request.status === 'open' || request.status === 'negotiating' || request.offers.some((offer) => {
      const vendorId = offer.vendor?._id || offer.vendor;
      return vendorId?.toString() === user._id.toString();
    });
  }
  return user.role === 'admin';
};

exports.createIntercityRequest = async (req, res) => {
  try {
    const {
      origin,
      destination,
      pickupPoint,
      dropPoint,
      startDate,
      endDate,
      passengers,
      vehicleType,
      budget,
      withDriver,
      returnTrip,
      notes,
    } = req.body;

    if (!origin || !destination || !startDate || !endDate) {
      return res.status(400).json({ message: 'Origin, destination, start date, and end date are required' });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const request = await IntercityRequest.create({
      customer: req.user._id,
      origin,
      destination,
      pickupPoint,
      dropPoint,
      startDate,
      endDate,
      passengers: Number(passengers || 1),
      vehicleType,
      budget: Number(budget || 0),
      withDriver: withDriver !== false,
      returnTrip: Boolean(returnTrip),
      notes,
    });

    const populated = await populateRequest(IntercityRequest.findById(request._id));
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getMyIntercityRequests = async (req, res) => {
  try {
    const requests = await populateRequest(
      IntercityRequest.find({ customer: req.user._id }).sort({ createdAt: -1 })
    );
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getVendorIntercityRequests = async (req, res) => {
  try {
    const requests = await populateRequest(
      IntercityRequest.find({ status: { $in: ['open', 'negotiating'] } }).sort({ createdAt: -1 }).limit(80)
    );
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createVendorOffer = async (req, res) => {
  try {
    const { routePackageId, vehicleId, price, message } = req.body;
    const request = await IntercityRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Intercity request not found' });

    if (!['open', 'negotiating'].includes(request.status)) {
      return res.status(400).json({ message: 'This request is no longer accepting vendor offers' });
    }

    let routePackage = null;
    let vehicle = null;

    if (routePackageId) {
      routePackage = await RoutePackage.findOne({ _id: routePackageId, vendor: req.user._id, active: true });
      if (!routePackage) return res.status(404).json({ message: 'Route package not found in your active offers' });
    }

    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, vendor: req.user._id, isApproved: true, isAvailable: true });
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found in your approved available fleet' });
    } else if (routePackage?.vehicle) {
      vehicle = await Vehicle.findOne({ _id: routePackage.vehicle, vendor: req.user._id, isApproved: true, isAvailable: true });
    }

    const offerPrice = Number(price || routePackage?.priceMin || vehicle?.pricing?.dailyRate || 0);
    if (!offerPrice) return res.status(400).json({ message: 'Offer price is required' });

    request.offers.push({
      vendor: req.user._id,
      routePackage: routePackage?._id,
      vehicle: vehicle?._id,
      price: offerPrice,
      message: message || '',
    });
    request.messages.push({
      sender: req.user._id,
      vendor: req.user._id,
      body: message || `Vendor offered BDT ${offerPrice.toLocaleString()} for this intercity ride.`,
    });
    request.status = 'negotiating';
    await request.save();

    const populated = await populateRequest(IntercityRequest.findById(request._id));
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.acceptVendorOffer = async (req, res) => {
  try {
    const request = await IntercityRequest.findOne({ _id: req.params.id, customer: req.user._id });
    if (!request) return res.status(404).json({ message: 'Intercity request not found' });

    const offer = request.offers.id(req.params.offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    request.offers.forEach((item) => {
      item.status = item._id.toString() === offer._id.toString() ? 'accepted' : 'declined';
    });
    request.status = 'accepted';
    request.acceptedOffer = offer._id;
    request.acceptedVendor = offer.vendor;
    request.messages.push({
      sender: req.user._id,
      vendor: offer.vendor,
      body: 'Customer accepted this vendor offer.',
    });
    await request.save();

    const populated = await populateRequest(IntercityRequest.findById(request._id));
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addIntercityMessage = async (req, res) => {
  try {
    const { body, vendorId } = req.body;
    if (!body) return res.status(400).json({ message: 'Message body is required' });

    const request = await IntercityRequest.findById(req.params.id);
    if (!userCanAccessRequest(request, req.user)) {
      return res.status(403).json({ message: 'Not authorized for this intercity request' });
    }

    let threadVendor = vendorId;
    if (req.user.role === 'vendor') threadVendor = req.user._id;
    if (!threadVendor && request.acceptedVendor) threadVendor = request.acceptedVendor;
    if (!threadVendor && request.offers[0]?.vendor) threadVendor = request.offers[0].vendor;

    if (threadVendor && !mongoose.isValidObjectId(threadVendor)) {
      return res.status(400).json({ message: 'Invalid vendor thread' });
    }

    request.messages.push({
      sender: req.user._id,
      vendor: threadVendor,
      body,
    });

    if (request.status === 'open') request.status = 'negotiating';
    await request.save();

    const populated = await populateRequest(IntercityRequest.findById(request._id));
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
