import api from '../utils/api';

const vehicleService = {
  search: async (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.append(k, v);
    });
    const response = await api.get(`/vehicles?${searchParams.toString()}`);
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },
};

export default vehicleService;
