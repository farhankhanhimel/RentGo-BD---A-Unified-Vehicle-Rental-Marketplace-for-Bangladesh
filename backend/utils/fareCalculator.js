/**
 * Fare Calculator — Estimates fare for each vehicle based on route distance.
 * 
 * Pricing Logic:
 * - Base fare = dailyRate × number of days (or fraction)
 * - Driver fee = driverSurcharge × number of days (if with driver)
 * - Fuel estimate = distanceKm × fuelRatePerKm (if fuel excluded)
 * - Platform fee = included in vendor rates (not added here)
 */

const FUEL_RATE_PER_KM = 12; // ৳12 per km average fuel cost in Bangladesh

/**
 * Calculate fare estimates for a list of vehicles given route distance.
 * @param {Number} distanceKm - Route distance in km
 * @param {Number} durationMinutes - Route duration in minutes
 * @param {Array} vehicles - Array of Vehicle documents
 * @param {String} rentalMode - 'self_drive' or 'with_driver'
 * @returns {Object} - Grouped estimates by vehicle type
 */
function calculateFares(distanceKm, durationMinutes, vehicles, rentalMode = 'with_driver') {
  // Estimate number of days based on duration (minimum 1 day)
  const days = Math.max(1, Math.ceil(durationMinutes / (24 * 60)));

  const vehicleOffers = vehicles.map((vehicle) => {
    const pricing = vehicle.pricing || {};
    const baseFare = (pricing.dailyRate || 0) * days;
    const driverFee = rentalMode === 'with_driver' ? (pricing.driverSurcharge || 0) * days : 0;
    const fuelEstimate = pricing.fuelPolicy === 'excluded' ? Math.round(distanceKm * FUEL_RATE_PER_KM) : 0;
    const estimatedFare = baseFare + driverFee + fuelEstimate;

    return {
      vehicleId: vehicle._id,
      vehicleName: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
      vehicleType: vehicle.vehicleType,
      vendorId: vehicle.vendor?._id || vehicle.vendor,
      vendorName: vehicle.vendor?.vendorDetails?.businessName || vehicle.vendor?.name || 'Unknown',
      isVerified: vehicle.vendor?.vendorDetails?.isVerified || false,
      rating: vehicle.rating?.average || 0,
      photo: vehicle.photos?.[0] || null,
      features: vehicle.features || {},
      rentalMode,
      estimatedFare,
      fareBreakdown: {
        baseFare,
        driverFee,
        fuelEstimate,
        days,
      },
      dailyRate: pricing.dailyRate || 0,
    };
  });

  // Group by vehicle type
  const grouped = {};
  vehicleOffers.forEach((offer) => {
    const type = offer.vehicleType;
    if (!grouped[type]) {
      grouped[type] = {
        vehicleType: type,
        vendorOffers: [],
        fareRange: { min: Infinity, max: -Infinity },
        vendorCount: 0,
      };
    }
    grouped[type].vendorOffers.push(offer);
    grouped[type].fareRange.min = Math.min(grouped[type].fareRange.min, offer.estimatedFare);
    grouped[type].fareRange.max = Math.max(grouped[type].fareRange.max, offer.estimatedFare);
    grouped[type].vendorCount++;
  });

  // Convert grouped to array and sort offers by price
  const estimates = Object.values(grouped).map((group) => {
    group.vendorOffers.sort((a, b) => a.estimatedFare - b.estimatedFare);
    if (group.fareRange.min === Infinity) group.fareRange.min = 0;
    if (group.fareRange.max === -Infinity) group.fareRange.max = 0;
    return group;
  });

  return estimates;
}

module.exports = { calculateFares };
