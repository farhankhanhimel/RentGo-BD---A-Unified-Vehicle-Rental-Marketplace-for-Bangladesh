import api from '../utils/api';

const intercityRequestService = {
  createRequest: async (data) => {
    const response = await api.post('/intercity-requests', data);
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get('/intercity-requests/my');
    return response.data;
  },

  getVendorRequests: async () => {
    const response = await api.get('/intercity-requests/vendor/open');
    return response.data;
  },

  createOffer: async (requestId, data) => {
    const response = await api.post(`/intercity-requests/${requestId}/offers`, data);
    return response.data;
  },

  acceptOffer: async (requestId, offerId) => {
    const response = await api.post(`/intercity-requests/${requestId}/offers/${offerId}/accept`);
    return response.data;
  },

  sendMessage: async (requestId, data) => {
    const response = await api.post(`/intercity-requests/${requestId}/messages`, data);
    return response.data;
  },
};

export default intercityRequestService;
