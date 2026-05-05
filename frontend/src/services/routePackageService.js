import api from '../utils/api';

const routePackageService = {
  // Get all route packages
  getPackages: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.origin) params.append('origin', filters.origin);
    if (filters.destination) params.append('destination', filters.destination);
    if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);
    if (filters.withDriver !== undefined) params.append('withDriver', filters.withDriver);
    if (filters.passengers) params.append('passengers', filters.passengers);

    const response = await api.get(`/route-packages?${params}`);
    return response.data;
  },

  // Get package detail
  getPackageDetail: async (packageId) => {
    const response = await api.get(`/route-packages/${packageId}`);
    return response.data;
  },

  // Get package offers (vendors)
  getPackageOffers: async (packageId) => {
    const response = await api.get(`/route-packages/${packageId}/offers`);
    return response.data;
  },

  // Create a route package (vendor)
  createPackage: async (data) => {
    const response = await api.post('/route-packages', data);
    return response.data;
  },

  // Get vendor's packages
  getMyPackages: async () => {
    const response = await api.get('/route-packages/vendor/my-packages');
    return response.data;
  },

  // Update package (vendor)
  updatePackage: async (packageId, data) => {
    const response = await api.put(`/route-packages/${packageId}`, data);
    return response.data;
  },

  // Delete package (vendor)
  deletePackage: async (packageId) => {
    const response = await api.delete(`/route-packages/${packageId}`);
    return response.data;
  },

  // Book a route package (customer)
  bookPackage: async (packageId, data) => {
    const response = await api.post('/route-packages/bookings/create', {
      packageId,
      ...data,
    });
    return response.data;
  },

  // Get customer's bookings
  getMyBookings: async () => {
    const response = await api.get('/route-packages/bookings/my');
    return response.data;
  },

  // Get vendor's bookings
  getVendorBookings: async () => {
    const response = await api.get('/route-packages/vendor/bookings');
    return response.data;
  },

  // Get booking detail
  getBookingDetail: async (bookingId) => {
    const response = await api.get(`/route-packages/bookings/${bookingId}`);
    return response.data;
  },

  // Confirm booking (vendor)
  confirmBooking: async (bookingId, status) => {
    const response = await api.put(
      `/route-packages/bookings/${bookingId}/confirm`,
      { status }
    );
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    const response = await api.put(`/route-packages/bookings/${bookingId}/cancel`);
    return response.data;
  },
};

export default routePackageService;
