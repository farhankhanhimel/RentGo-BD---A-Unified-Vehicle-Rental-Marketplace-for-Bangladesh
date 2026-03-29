const Vehicle = require('../models/Vehicle');

const searchAndFilterVehicles = async (req, res) => {
  try {
    const { location, type, minPrice, maxPrice, transmission, fuelType, rentalMode } = req.query;
    let query = {};

    if (location) {
      query.operatingArea = { $regex: location, $options: 'i' };
    }

    if (type) query.vehicleType = type;
    if (transmission) query.transmission = transmission;
    if (fuelType) query.fuelType = fuelType;
    if (rentalMode) query.rentalMode = rentalMode;

    if (minPrice || maxPrice) {
      query.dailyRate = {};
      if (minPrice) query.dailyRate.$gte = Number(minPrice);
      if (maxPrice) query.dailyRate.$lte = Number(maxPrice);
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { searchAndFilterVehicles };