import api from '../utils/api'; 

const searchVehicles = async (queryParams) => {
  const params = new URLSearchParams(queryParams).toString();
  const response = await api.get(`/vehicles/search?${params}`);
  return response.data;
};

export const vehicleService = { searchVehicles };
