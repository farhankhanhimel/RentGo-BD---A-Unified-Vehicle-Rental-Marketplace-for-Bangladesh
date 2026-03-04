const Vehicle = require('../models/Vehicle');
const RouteEstimate = require('../models/RouteEstimate');
const { getDistanceMatrix, geocodeAddress } = require('../utils/googleMapsService');
const { calculateFares } = require('../utils/fareCalculator');

// @desc    Estimate fare for a route
// @route   POST /api/routes/estimate
// @access  Public
exports.estimateFare = async (req, res) => {
  try {
    const { pickup, destination, vehicleType, rentalMode } = req.body;

    // Validate input
    if (!pickup || !destination) {
      return res.status(400).json({ message: 'Pickup and destination are required' });
    }

    // Get coordinates if addresses provided (instead of lat/lng)
    let pickupCoords = { lat: pickup.lat, lng: pickup.lng };
    let destCoords = { lat: destination.lat, lng: destination.lng };

    if (!pickupCoords.lat && pickup.address) {
      const geo = await geocodeAddress(pickup.address);
      if (geo) {
        pickupCoords = { lat: geo.lat, lng: geo.lng };
      }
    }

    if (!destCoords.lat && destination.address) {
      const geo = await geocodeAddress(destination.address);
      if (geo) {
        destCoords = { lat: geo.lat, lng: geo.lng };
      }
    }

    if (!pickupCoords.lat || !destCoords.lat) {
      return res.status(400).json({ message: 'Unable to determine coordinates. Please provide lat/lng or a valid address.' });
    }

    // Calculate distance and duration
    const routeInfo = await getDistanceMatrix(pickupCoords, destCoords);

    // Build vehicle query
    const vehicleQuery = {
      isAvailable: true,
      isApproved: true,
    };

    if (vehicleType) {
      vehicleQuery.vehicleType = vehicleType;
    }

    // If pickup location has a city, filter by it
    if (pickup.city) {
      vehicleQuery['location.city'] = new RegExp(pickup.city, 'i');
    }

    // Fetch available vehicles with vendor details
    const vehicles = await Vehicle.find(vehicleQuery)
      .populate('vendor', 'name vendorDetails.businessName vendorDetails.isVerified vendorDetails.verificationBadge')
      .limit(50);

    // Calculate fare estimates
    const estimates = calculateFares(
      routeInfo.distanceKm,
      routeInfo.durationMinutes,
      vehicles,
      rentalMode || 'with_driver'
    );

    // Cache the estimate
    try {
      await RouteEstimate.create({
        pickupLocation: {
          address: pickup.address || `${pickupCoords.lat}, ${pickupCoords.lng}`,
          coordinates: pickupCoords,
        },
        destination: {
          address: destination.address || `${destCoords.lat}, ${destCoords.lng}`,
          coordinates: destCoords,
        },
        distanceKm: routeInfo.distanceKm,
        durationMinutes: routeInfo.durationMinutes,
        estimatedFares: estimates.map((e) => ({
          vehicleType: e.vehicleType,
          minFare: e.fareRange.min,
          maxFare: e.fareRange.max,
          averageFare: Math.round((e.fareRange.min + e.fareRange.max) / 2),
          vendorCount: e.vendorCount,
        })),
      });
    } catch (cacheErr) {
      // Caching failure should not break the response
      console.error('Route cache error:', cacheErr.message);
    }

    res.json({
      route: {
        distanceKm: routeInfo.distanceKm,
        durationMinutes: routeInfo.durationMinutes,
        distanceText: routeInfo.distanceText,
        durationText: routeInfo.durationText,
      },
      estimates,
      totalVehiclesFound: vehicles.length,
    });
  } catch (error) {
    console.error('Estimate fare error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Bangladesh cities with areas and coordinates
// @route   GET /api/routes/cities
// @access  Public
exports.getCities = async (req, res) => {
  try {
    const cities = [
      {
        id: 'dhaka',
        name: 'Dhaka',
        lat: 23.8103,
        lng: 90.4125,
        areas: [
          { name: 'Dhanmondi', lat: 23.7461, lng: 90.3742 },
          { name: 'Gulshan', lat: 23.7925, lng: 90.4078 },
          { name: 'Banani', lat: 23.7937, lng: 90.4066 },
          { name: 'Uttara', lat: 23.8759, lng: 90.3795 },
          { name: 'Mirpur', lat: 23.8042, lng: 90.3527 },
          { name: 'Mohammadpur', lat: 23.7662, lng: 90.3586 },
          { name: 'Motijheel', lat: 23.7333, lng: 90.4175 },
          { name: 'Tejgaon', lat: 23.7630, lng: 90.3930 },
          { name: 'Badda', lat: 23.7806, lng: 90.4260 },
          { name: 'Bashundhara', lat: 23.8130, lng: 90.4300 },
          { name: 'Hazrat Shahjalal Airport', lat: 23.8513, lng: 90.4086 },
          { name: 'Old Dhaka (Puran Dhaka)', lat: 23.7104, lng: 90.4074 },
          { name: 'Farmgate', lat: 23.7573, lng: 90.3876 },
          { name: 'Rampura', lat: 23.7620, lng: 90.4250 },
          { name: 'Jatrabari', lat: 23.7104, lng: 90.4350 },
        ],
      },
      {
        id: 'chittagong',
        name: 'Chittagong',
        lat: 22.3569,
        lng: 91.7832,
        areas: [
          { name: 'Agrabad', lat: 22.3250, lng: 91.8100 },
          { name: 'Nasirabad', lat: 22.3600, lng: 91.7900 },
          { name: 'GEC Circle', lat: 22.3575, lng: 91.8175 },
          { name: 'Patenga', lat: 22.2352, lng: 91.7914 },
          { name: 'Halishahar', lat: 22.3361, lng: 91.7580 },
          { name: 'Shah Amanat Airport', lat: 22.2496, lng: 91.8133 },
          { name: 'Chawkbazar', lat: 22.3475, lng: 91.8350 },
          { name: 'Khulshi', lat: 22.3580, lng: 91.8050 },
        ],
      },
      {
        id: 'sylhet',
        name: 'Sylhet',
        lat: 24.8949,
        lng: 91.8687,
        areas: [
          { name: 'Zindabazar', lat: 24.8940, lng: 91.8700 },
          { name: 'Amberkhana', lat: 24.9000, lng: 91.8720 },
          { name: 'Subid Bazar', lat: 24.8870, lng: 91.8760 },
          { name: 'Tilagarh', lat: 24.9120, lng: 91.8600 },
          { name: 'Osmani Airport', lat: 24.9630, lng: 91.8668 },
          { name: 'Srimangal', lat: 24.3065, lng: 91.7296 },
          { name: 'Jaflong', lat: 25.1560, lng: 92.0150 },
        ],
      },
      {
        id: 'coxs-bazar',
        name: "Cox's Bazar",
        lat: 21.4272,
        lng: 92.0058,
        areas: [
          { name: 'Kolatoli Beach', lat: 21.4320, lng: 91.9800 },
          { name: 'Laboni Beach', lat: 21.4350, lng: 91.9690 },
          { name: 'Inani Beach', lat: 21.2970, lng: 92.0650 },
          { name: 'Himchari', lat: 21.3890, lng: 92.0100 },
          { name: 'Marine Drive Road', lat: 21.3500, lng: 92.0250 },
          { name: "Cox's Bazar Airport", lat: 21.4522, lng: 91.9639 },
          { name: 'Teknaf', lat: 20.8625, lng: 92.3048 },
        ],
      },
      {
        id: 'rajshahi',
        name: 'Rajshahi',
        lat: 24.3636,
        lng: 88.6241,
        areas: [
          { name: 'Shaheb Bazar', lat: 24.3620, lng: 88.6050 },
          { name: 'New Market', lat: 24.3700, lng: 88.5950 },
          { name: 'Rajshahi University', lat: 24.3703, lng: 88.6296 },
          { name: 'Padma Garden', lat: 24.3630, lng: 88.5850 },
          { name: 'Shah Makhdum Airport', lat: 24.4372, lng: 88.6166 },
          { name: 'Laxmipur', lat: 24.3500, lng: 88.6400 },
        ],
      },
      {
        id: 'khulna',
        name: 'Khulna',
        lat: 22.8456,
        lng: 89.5403,
        areas: [
          { name: 'Boyra', lat: 22.8180, lng: 89.5300 },
          { name: 'Shibbari', lat: 22.8200, lng: 89.5550 },
          { name: 'Royal More', lat: 22.8120, lng: 89.5400 },
          { name: 'Daulatpur', lat: 22.8400, lng: 89.5000 },
          { name: 'Sundarbans Gateway (Mongla)', lat: 22.4893, lng: 89.5877 },
          { name: 'Khan Jahan Ali Airport', lat: 22.8083, lng: 89.5283 },
        ],
      },
      {
        id: 'rangpur',
        name: 'Rangpur',
        lat: 25.7439,
        lng: 89.2752,
        areas: [
          { name: 'Shapla Chattar', lat: 25.7440, lng: 89.2570 },
          { name: 'Station Road', lat: 25.7460, lng: 89.2700 },
          { name: 'Dhap', lat: 25.7500, lng: 89.2800 },
          { name: 'Mahiganj', lat: 25.7600, lng: 89.2900 },
        ],
      },
      {
        id: 'barisal',
        name: 'Barisal',
        lat: 22.7010,
        lng: 90.3535,
        areas: [
          { name: 'Sadar Road', lat: 22.7020, lng: 90.3600 },
          { name: 'Nathullabad', lat: 22.7100, lng: 90.3700 },
          { name: 'Band Road', lat: 22.6950, lng: 90.3520 },
          { name: 'Launch Terminal', lat: 22.6980, lng: 90.3480 },
        ],
      },
      {
        id: 'mymensingh',
        name: 'Mymensingh',
        lat: 24.7471,
        lng: 90.4203,
        areas: [
          { name: 'Ganginarpar', lat: 24.7530, lng: 90.4050 },
          { name: 'Town Hall', lat: 24.7500, lng: 90.4100 },
          { name: 'Charpara', lat: 24.7400, lng: 90.4300 },
          { name: 'Agricultural University', lat: 24.7230, lng: 90.4303 },
        ],
      },
      {
        id: 'comilla',
        name: 'Comilla',
        lat: 23.4607,
        lng: 91.1809,
        areas: [
          { name: 'Kandirpar', lat: 23.4600, lng: 91.1820 },
          { name: 'Tomsom Bridge', lat: 23.4610, lng: 91.1780 },
          { name: 'Comilla Cantonment', lat: 23.4420, lng: 91.1730 },
          { name: 'Laksam', lat: 23.2406, lng: 91.1252 },
        ],
      },
      {
        id: 'gazipur',
        name: 'Gazipur',
        lat: 23.9999,
        lng: 90.4203,
        areas: [
          { name: 'Chowrasta', lat: 23.9990, lng: 90.4220 },
          { name: 'Board Bazar', lat: 23.9680, lng: 90.3960 },
          { name: 'Tongi', lat: 23.8916, lng: 90.4193 },
          { name: 'Kaliakair', lat: 24.0795, lng: 90.2186 },
        ],
      },
      {
        id: 'narayanganj',
        name: 'Narayanganj',
        lat: 23.6238,
        lng: 90.5000,
        areas: [
          { name: 'Chashara', lat: 23.6200, lng: 90.4950 },
          { name: 'Shiddhirganj', lat: 23.6580, lng: 90.5020 },
          { name: 'Fatullah', lat: 23.6650, lng: 90.4830 },
          { name: 'Sonargaon', lat: 23.6500, lng: 90.6100 },
        ],
      },
    ];

    res.json(cities);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reverse geocode coordinates to address
// @route   POST /api/routes/reverse-geocode
// @access  Public
exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      // Fallback: return coordinates as address
      return res.json({
        address: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
        lat: Number(lat),
        lng: Number(lng),
      });
    }

    const { Client } = require('@googlemaps/google-maps-services-js');
    const mapsClient = new Client({});

    const response = await mapsClient.reverseGeocode({
      params: {
        latlng: { lat: Number(lat), lng: Number(lng) },
        key: apiKey,
        language: 'en',
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return res.json({
        address: result.formatted_address,
        lat: Number(lat),
        lng: Number(lng),
      });
    }

    return res.json({
      address: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
      lat: Number(lat),
      lng: Number(lng),
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get popular routes
// @route   GET /api/routes/popular
// @access  Public
exports.getPopularRoutes = async (req, res) => {
  try {
    const popularRoutes = [
      {
        id: 1,
        name: 'Dhaka to Cox\'s Bazar',
        pickup: { address: 'Dhaka', lat: 23.8103, lng: 90.4125 },
        destination: { address: 'Cox\'s Bazar', lat: 21.4272, lng: 92.0058 },
        distanceKm: 390,
        estimatedTime: '7-8 hours',
        startingFare: 10000,
        image: '🏖️',
      },
      {
        id: 2,
        name: 'Dhaka to Chittagong',
        pickup: { address: 'Dhaka', lat: 23.8103, lng: 90.4125 },
        destination: { address: 'Chittagong', lat: 22.3569, lng: 91.7832 },
        distanceKm: 265,
        estimatedTime: '5-6 hours',
        startingFare: 7000,
        image: '🏙️',
      },
      {
        id: 3,
        name: 'Dhaka to Sylhet',
        pickup: { address: 'Dhaka', lat: 23.8103, lng: 90.4125 },
        destination: { address: 'Sylhet', lat: 24.8949, lng: 91.8687 },
        distanceKm: 240,
        estimatedTime: '4-5 hours',
        startingFare: 6500,
        image: '🍃',
      },
      {
        id: 4,
        name: 'Dhaka to Rajshahi',
        pickup: { address: 'Dhaka', lat: 23.8103, lng: 90.4125 },
        destination: { address: 'Rajshahi', lat: 24.3636, lng: 88.6241 },
        distanceKm: 260,
        estimatedTime: '5-6 hours',
        startingFare: 7000,
        image: '🏛️',
      },
      {
        id: 5,
        name: 'Dhaka to Sundarbans',
        pickup: { address: 'Dhaka', lat: 23.8103, lng: 90.4125 },
        destination: { address: 'Khulna', lat: 22.8456, lng: 89.5403 },
        distanceKm: 280,
        estimatedTime: '6-7 hours',
        startingFare: 7500,
        image: '🌴',
      },
      {
        id: 6,
        name: 'Dhaka to Saint Martin',
        pickup: { address: 'Dhaka', lat: 23.8103, lng: 90.4125 },
        destination: { address: 'Teknaf', lat: 20.8625, lng: 92.3048 },
        distanceKm: 420,
        estimatedTime: '9-10 hours',
        startingFare: 12000,
        image: '🏝️',
      },
    ];

    res.json(popularRoutes);
  } catch (error) {
    console.error('Get popular routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
