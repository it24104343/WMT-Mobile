import api from './api';

const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
  },

  updateRevenueConfig: async (data) => {
    const response = await api.put('/settings/revenue-config', data);
    return response.data;
  },

  deleteRevenueConfig: async (classId) => {
    const response = await api.delete(`/settings/revenue-config/${classId}`);
    return response.data;
  }
};

export default settingsService;
