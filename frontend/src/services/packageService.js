import api from '../utils/api';

export const getPackages = async () => {
  const res = await api.get('/packages');
  return res.data.packages;
};

export const getPackageOffers = async (packageId) => {
  const res = await api.get(`/packages/${packageId}/offers`);
  return res.data;
};

export default { getPackages, getPackageOffers };
