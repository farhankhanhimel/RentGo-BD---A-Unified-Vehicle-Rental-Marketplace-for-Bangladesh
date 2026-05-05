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
  getRoutePackages: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') queryParams.append(key, value);
    });
    const query = queryParams.toString();
    const response = await api.get(`/route-packages${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Vendor route package management
  getMyRoutePackages: async () => {
    const response = await api.get('/route-packages/vendor/my-packages');
    return response.data;
  },

  createRoutePackage: async (data) => {
    const response = await api.post('/route-packages', data);
    return response.data;
  },

  updateRoutePackage: async (packageId, data) => {
    const response = await api.put(`/route-packages/${packageId}`, data);
    return response.data;
  },

  deleteRoutePackage: async (packageId) => {
    const response = await api.delete(`/route-packages/${packageId}`);
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
