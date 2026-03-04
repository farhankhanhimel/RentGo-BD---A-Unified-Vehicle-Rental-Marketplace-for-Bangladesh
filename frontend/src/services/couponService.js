import api from '../utils/api';

const couponService = {
  // Get coupons (vendor/admin)
  getCoupons: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    const response = await api.get(`/coupons?${queryParams.toString()}`);
    return response.data;
  },

  // Create coupon
  createCoupon: async (data) => {
    const response = await api.post('/coupons', data);
    return response.data;
  },

  // Update coupon
  updateCoupon: async (id, data) => {
    const response = await api.put(`/coupons/${id}`, data);
    return response.data;
  },

  // Delete coupon
  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },

  // Toggle coupon
  toggleCoupon: async (id) => {
    const response = await api.put(`/coupons/${id}/toggle`);
    return response.data;
  },

  // Validate coupon (customer)
  validateCoupon: async (code, orderAmount, vehicleType, tripType) => {
    const response = await api.post('/coupons/validate', {
      code,
      orderAmount,
      vehicleType,
      tripType,
    });
    return response.data;
  },

  // Get available coupons (customer)
  getAvailableCoupons: async () => {
    const response = await api.get('/coupons/available');
    return response.data;
  },
};

export default couponService;
