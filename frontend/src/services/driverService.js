import api from '../utils/api';

export const getVendorDrivers = async () => {
  const response = await api.get('/drivers');
  return response.data;
};

export const createDriver = async (driverData) => {
  const response = await api.post('/drivers', driverData);
  return response.data;
};

export const updateDriver = async (driverId, driverData) => {
  const response = await api.put(`/drivers/${driverId}`, driverData);
  return response.data;
};

export const deleteDriver = async (driverId) => {
  const response = await api.delete(`/drivers/${driverId}`);
  return response.data;
};

export const getVendorBookings = async () => {
  const response = await api.get('/drivers/bookings/vendor');
  return response.data;
};

export const assignDriverToBooking = async (bookingId, driverId) => {
  const response = await api.patch(`/drivers/bookings/${bookingId}/assign-driver`, { driverId });
  return response.data;
};

export const getVehicleDriverRatings = async (vendorId) => {
  const response = await api.get(`/drivers/vehicle/${vendorId}`);
  return response.data;
};
