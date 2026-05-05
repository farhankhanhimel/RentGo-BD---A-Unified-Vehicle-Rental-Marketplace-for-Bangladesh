import api from '../utils/api';

export const getUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data);
export const updateUser = (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);

export const getPendingVendors = () => api.get('/admin/vendors/pending').then((r) => r.data);
export const verifyVendor = (id, approve = true) => api.patch(`/admin/vendors/${id}/verify`, { approve }).then((r) => r.data);

export const getDisputes = () => api.get('/admin/disputes').then((r) => r.data);
export const updateDispute = (id, data) => api.patch(`/admin/disputes/${id}`, data).then((r) => r.data);

export const getConfig = () => api.get('/admin/config').then((r) => r.data);
export const setCommission = (percent) => api.post('/admin/config/commission', { percent }).then((r) => r.data);

export const getAnalytics = () => api.get('/admin/analytics').then((r) => r.data);
export const getPendingVehicles = () => api.get('/vehicles/admin/pending').then((r) => r.data);
export const approveVehicle = (id) => api.patch(`/vehicles/${id}/approve`).then((r) => r.data);
export const rejectVehicle = (id, reason = '') => api.patch(`/vehicles/${id}/reject`, { reason }).then((r) => r.data);

const adminService = {
  getUsers,
  updateUser,
  deleteUser,
  getPendingVendors,
  verifyVendor,
  getDisputes,
  updateDispute,
  getConfig,
  setCommission,
  getAnalytics,
  getPendingVehicles,
  approveVehicle,
  rejectVehicle,
};

export default adminService;
