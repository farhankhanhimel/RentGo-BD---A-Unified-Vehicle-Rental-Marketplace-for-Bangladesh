const Vehicle = require('../models/Vehicle');

exports.getAdvancedSearchResults = async (req, res) => {
  try {
    const { city, vehicleType, minPrice, maxPrice, transmission, fuelType, rentalMode, ac, seats, tripType, sort } = req.query;
    let filter = {};

    // Upgraded to case-insensitive searches
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (vehicleType) filter.vehicleType = new RegExp(vehicleType, 'i');
    if (transmission) filter['features.transmission'] = new RegExp(transmission, 'i');
    if (fuelType) filter['features.fuelType'] = new RegExp(fuelType, 'i');
    
    if (ac) filter['features.ac'] = ac === 'true';
    if (seats) filter['features.seats'] = { $gte: Number(seats) };
    if (rentalMode) filter.rentalMode = { $in: [rentalMode, 'both', new RegExp(rentalMode, 'i')] };
    
    if (minPrice || maxPrice) {
      filter['pricing.dailyRate'] = {};
      if (minPrice) filter['pricing.dailyRate'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.dailyRate'].$lte = Number(maxPrice);
    }

    // --- THE UPGRADED SMART RECOMMENDATION BRAIN ---
    if (tripType) {
      const tripConfig = {
        // Using 'i' makes it ignore capital letters (catches 'Car', 'CAR', 'car', 'SUV', etc.)
        tourism: [/car/i, /microbus/i, /suv/i, /van/i, /jeep/i],
        airport_transfer: [/car/i, /microbus/i, /van/i, /sedan/i, /hiace/i],
        wedding: [/car/i, /microbus/i, /sedan/i, /premium/i, /luxury/i, /suv/i, /prado/i],
        office: [/car/i, /motorcycle/i, /bike/i, /sedan/i],
        emergency: [/motorcycle/i, /car/i, /ambulance/i]
      };
      
      if (tripConfig[tripType]) {
        filter.vehicleType = { $in: tripConfig[tripType] };
      }
    }

    let vehicles = await Vehicle.find(filter).populate('vendor', 'name');

    if (sort === 'price_asc') vehicles.sort((a, b) => a.pricing.dailyRate - b.pricing.dailyRate);
    if (sort === 'price_desc') vehicles.sort((a, b) => b.pricing.dailyRate - a.pricing.dailyRate);
    if (sort === 'newest') vehicles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};