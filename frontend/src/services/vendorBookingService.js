import api from '../utils/api';

const vendorBookingService = {
  // Get vendor bookings with filters
  getBookings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        queryParams.append(key, value);
      }
    });
    const response = await api.get(`/vendor-bookings?${queryParams.toString()}`);
    return response.data;
  },

  // Get single booking detail
  getBookingDetail: async (id) => {
    const response = await api.get(`/vendor-bookings/${id}`);
    return response.data;
  },

  // Update booking status
  updateStatus: async (id, data) => {
    const response = await api.put(`/vendor-bookings/${id}/status`, data);
    return response.data;
  },

  // Update payment status
  updatePayment: async (id, data) => {
    const response = await api.put(`/vendor-bookings/${id}/payment`, data);
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/vendor-bookings/stats');
    return response.data;
  },

  // Export CSV
  exportCSV: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    const response = await api.get(`/vendor-bookings/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Export PDF report
  exportPDF: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    queryParams.append('format', 'pdf');
    const response = await api.get(`/vendor-bookings/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bookings_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Respond to request-mode booking
  respondToBooking: async (id, data) => {
    const response = await api.put(`/vendor-bookings/${id}/respond`, data);
    return response.data;
  },

  // Get calendar bookings
  getCalendarBookings: async (month, year) => {
    const response = await api.get(`/vendor-bookings/calendar?month=${month}&year=${year}`);
    return response.data;
  },
};

export default vendorBookingService;
