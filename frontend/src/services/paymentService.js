import api from '../utils/api';

export const getPaymentBookings = async () => {
  const response = await api.get('/payments/bookings');
  return response.data;
};

export const initiatePayment = async (bookingId, paymentMode, couponCode = '') => {
  const response = await api.post('/payments/initiate', { bookingId, paymentMode, couponCode });
  return response.data;
};

export const retryPayment = async (transactionId) => {
  const response = await api.post(`/payments/retry/${transactionId}`);
  return response.data;
};

export const getReceipt = async (transactionId) => {
  const response = await api.get(`/payments/receipt/${transactionId}`);
  return response.data;
};
