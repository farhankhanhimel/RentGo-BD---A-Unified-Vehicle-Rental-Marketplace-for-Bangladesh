import api from '../utils/api';

const verificationService = {
  // Vendor: submit documents
  submitVerification: async (data) => {
    const response = await api.post('/verification/submit', data);
    return response.data;
  },

  // Vendor: get own status
  getVerificationStatus: async () => {
    const response = await api.get('/verification/status');
    return response.data;
  },

  // Admin: get stats
  getVerificationStats: async () => {
    const response = await api.get('/verification/stats');
    return response.data;
  },

  // Admin: get queue
  getVerificationQueue: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    const response = await api.get(`/verification/queue?${queryParams.toString()}`);
    return response.data;
  },

  // Admin: get vendor detail
  getVerificationDetail: async (vendorId) => {
    const response = await api.get(`/verification/${vendorId}`);
    return response.data;
  },

  // Admin: approve
  approveVerification: async (vendorId) => {
    const response = await api.put(`/verification/${vendorId}/approve`);
    return response.data;
  },

  // Admin: reject
  rejectVerification: async (vendorId, reason) => {
    const response = await api.put(`/verification/${vendorId}/reject`, { reason });
    return response.data;
  },

  // Admin: revoke
  revokeVerification: async (vendorId, reason) => {
    const response = await api.put(`/verification/${vendorId}/revoke`, { reason });
    return response.data;
  },
};

export default verificationService;
