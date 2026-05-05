import api from '../utils/api';

const routeService = {
  // Estimate fare for a route
  estimateFare: async (pickup, destination, filters = {}) => {
    const response = await api.post('/routes/estimate', {
      pickup,
      destination,
      ...filters,
    });
    return response.data;
  },

  // Get popular routes
  getPopularRoutes: async () => {
    const response = await api.get('/routes/popular');
    return response.data;
  },

  // Get pre-built route packages
  getRoutePackages: async () => {
    const response = await api.get('/route-packages');
    return response.data;
  },

  // Get offers for a route package
  getRoutePackageOffers: async (packageId) => {
    const response = await api.get(`/route-packages/${packageId}/offers`);
    return response.data;
  },

  // Get Bangladesh cities with areas
  getCities: async () => {
    const response = await api.get('/routes/cities');
    return response.data;
  },

  // Reverse geocode coordinates to address
  reverseGeocode: async (lat, lng) => {
    const response = await api.post('/routes/reverse-geocode', { lat, lng });
    return response.data;
  },
};

export default routeService;
