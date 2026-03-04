const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

/**
 * Get distance and duration between two points using Google Distance Matrix API.
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Object} { distanceKm, durationMinutes, distanceText, durationText }
 */
async function getDistanceMatrix(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    // Fallback: estimate using Haversine formula when API key is not configured
    return getHaversineEstimate(origin, destination);
  }

  try {
    const response = await client.distancematrix({
      params: {
        origins: [`${origin.lat},${origin.lng}`],
        destinations: [`${destination.lat},${destination.lng}`],
        key: apiKey,
        mode: 'driving',
      },
    });

    const element = response.data.rows[0].elements[0];

    if (element.status === 'OK') {
      return {
        distanceKm: element.distance.value / 1000,
        durationMinutes: Math.ceil(element.duration.value / 60),
        distanceText: element.distance.text,
        durationText: element.duration.text,
      };
    }

    // Fallback if Google returns non-OK status
    return getHaversineEstimate(origin, destination);
  } catch (error) {
    console.error('Google Maps API error:', error.message);
    return getHaversineEstimate(origin, destination);
  }
}

/**
 * Geocode an address to coordinates.
 * @param {String} address - Text address
 * @returns {Object} { lat, lng, formattedAddress }
 */
async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return null;
  }

  try {
    const response = await client.geocode({
      params: {
        address,
        key: apiKey,
        region: 'bd', // Bias results to Bangladesh
      },
    });

    if (response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

/**
 * Haversine formula to estimate distance between two coordinates.
 * Used as a fallback when Google Maps API is not configured.
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Object} { distanceKm, durationMinutes, distanceText, durationText }
 */
function getHaversineEstimate(origin, destination) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // Road distance is typically 1.3x straight-line distance
  const distanceKm = Math.round(straightLineKm * 1.3 * 10) / 10;
  // Average speed assumption: 50 km/h for Bangladesh roads
  const durationMinutes = Math.ceil((distanceKm / 50) * 60);

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  return {
    distanceKm,
    durationMinutes,
    distanceText: `${distanceKm} km`,
    durationText: hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`,
  };
}

/**
 * Get directions (route polyline) between two points using Google Directions API.
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Object} { polyline, steps[], distanceKm, durationMinutes, summary }
 */
async function getDirections(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    // Return a simple straight-line fallback when no API key
    const haversine = getHaversineEstimate(origin, destination);
    return {
      polyline: null,
      steps: [],
      distanceKm: haversine.distanceKm,
      durationMinutes: haversine.durationMinutes,
      summary: `${haversine.distanceText} (estimated)`,
    };
  }

  try {
    const response = await client.directions({
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: apiKey,
        mode: 'driving',
        region: 'bd',
      },
    });

    if (response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step) => ({
          instruction: step.html_instructions,
          distance: step.distance.text,
          duration: step.duration.text,
        })),
        distanceKm: leg.distance.value / 1000,
        durationMinutes: Math.ceil(leg.duration.value / 60),
        summary: route.summary,
      };
    }

    // Fallback
    const haversine = getHaversineEstimate(origin, destination);
    return {
      polyline: null,
      steps: [],
      distanceKm: haversine.distanceKm,
      durationMinutes: haversine.durationMinutes,
      summary: `${haversine.distanceText} (estimated)`,
    };
  } catch (error) {
    console.error('Google Directions API error:', error.message);
    const haversine = getHaversineEstimate(origin, destination);
    return {
      polyline: null,
      steps: [],
      distanceKm: haversine.distanceKm,
      durationMinutes: haversine.durationMinutes,
      summary: `${haversine.distanceText} (estimated)`,
    };
  }
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  getDistanceMatrix,
  getDirections,
  geocodeAddress,
  getHaversineEstimate,
};
