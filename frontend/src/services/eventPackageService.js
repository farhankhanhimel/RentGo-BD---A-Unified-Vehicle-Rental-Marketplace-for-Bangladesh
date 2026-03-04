import api from '../utils/api';

const eventPackageService = {
  // Get all packages (public)
  getPackages: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    const response = await api.get(`/event-packages?${queryParams.toString()}`);
    return response.data;
  },

  // Get package detail
  getPackageDetail: async (id) => {
    const response = await api.get(`/event-packages/${id}`);
    return response.data;
  },

  // Get vendor's packages
  getMyPackages: async () => {
    const response = await api.get('/event-packages/vendor/my-packages');
    return response.data;
  },

  // Create package (vendor)
  createPackage: async (data) => {
    const response = await api.post('/event-packages', data);
    return response.data;
  },

  // Update package
  updatePackage: async (id, data) => {
    const response = await api.put(`/event-packages/${id}`, data);
    return response.data;
  },

  // Delete package
  deletePackage: async (id) => {
    const response = await api.delete(`/event-packages/${id}`);
    return response.data;
  },

  // Book package (customer)
  bookPackage: async (id, data) => {
    const response = await api.post(`/event-packages/${id}/book`, data);
    return response.data;
  },

  // Get vendor's package bookings
  getPackageBookings: async () => {
    const response = await api.get('/event-packages/vendor/bookings');
    return response.data;
  },

  // Update package booking status
  updateBookingStatus: async (bookingId, status) => {
    const response = await api.put(`/event-packages/bookings/${bookingId}/status`, { status });
    return response.data;
  },
};

export default eventPackageService;
