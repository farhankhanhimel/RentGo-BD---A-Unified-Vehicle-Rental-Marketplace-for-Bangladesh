import api from '../utils/api';

// Wishlist API service
const wishlistService = {
  // Get user's wishlist
  getWishlist: async (page = 1, limit = 12) => {
    const response = await api.get(`/wishlist?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Add vehicle to wishlist
  addToWishlist: async (vehicleId) => {
    const response = await api.post('/wishlist', { vehicleId });
    return response.data;
  },

  // Remove vehicle from wishlist
  removeFromWishlist: async (vehicleId) => {
    const response = await api.delete(`/wishlist/${vehicleId}`);
    return response.data;
  },

  // Check if vehicle is in wishlist
  checkWishlist: async (vehicleId) => {
    const response = await api.get(`/wishlist/check/${vehicleId}`);
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (vehicleId, preferences) => {
    const response = await api.put(`/wishlist/${vehicleId}/preferences`, preferences);
    return response.data;
  },
};

export default wishlistService;
