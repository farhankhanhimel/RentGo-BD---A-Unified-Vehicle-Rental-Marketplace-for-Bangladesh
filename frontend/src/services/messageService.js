import api from '../utils/api';

const messageService = {
  // Send a message
  sendMessage: async (recipientId, content, type = 'text', metadata = {}, context = {}) => {
    const response = await api.post('/messages/send', {
      recipient: recipientId,
      content,
      type,
      metadata,
      ...context,
    });
    return response.data;
  },

  // Get chat history with a user
  getChatHistory: async (userId, options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.bookingId) params.append('bookingId', options.bookingId);
    if (options.routePackageBookingId) {
      params.append('routePackageBookingId', options.routePackageBookingId);
    }
    if (options.intercityRequestId) {
      params.append('intercityRequestId', options.intercityRequestId);
    }

    const response = await api.get(`/messages/history/${userId}?${params}`);
    return response.data;
  },

  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/messages');
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (userId) => {
    const response = await api.put(`/messages/${userId}/read`);
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Send an offer
  sendOffer: async (recipientId, price, offerDetails = '', context = {}) => {
    const response = await api.post('/messages/offer', {
      recipient: recipientId,
      price,
      offerDetails,
      ...context,
    });
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread/count');
    return response.data;
  },
};

export default messageService;
