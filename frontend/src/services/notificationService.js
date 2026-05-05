import api from '../utils/api';

// Notification API service
const notificationService = {
  // Get notifications
  getNotifications: async (page = 1, limit = 20, filter = '') => {
    const params = new URLSearchParams({ page, limit });
    if (filter) params.append('filter', filter);
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark one notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationService;
