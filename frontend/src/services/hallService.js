import api from './api';

const hallService = {
  // Get all halls with pagination and filters
  getHalls: async (params = {}) => {
    const response = await api.get('/halls', { params });
    return response.data;
  },

  // Get single hall by ID
  getHallById: async (id) => {
    const response = await api.get(`/halls/${id}`);
    return response.data;
  },

  // Create new hall
  createHall: async (hallData) => {
    const response = await api.post('/halls', hallData);
    return response.data;
  },

  // Update hall
  updateHall: async (id, hallData) => {
    const response = await api.put(`/halls/${id}`, hallData);
    return response.data;
  },

  // Delete hall (soft delete)
  deleteHall: async (id) => {
    const response = await api.delete(`/halls/${id}`);
    return response.data;
  },

  // Check hall availability
  checkHallAvailability: async (data) => {
    const response = await api.post('/halls/check-availability', data);
    return response.data;
  },

  // Get weekly availability for all halls
  getWeeklyAvailability: async () => {
    const response = await api.get('/halls/weekly-availability');
    return response.data;
  }
};

export default hallService;
