import api from './api';

const materialService = {
  getMaterials: async (params = {}) => {
    const response = await api.get('/materials', { params });
    return response.data;
  },
  getMaterialById: async (id) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },
  createMaterial: async (formData) => {
    const response = await api.post('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  updateMaterial: async (id, formData) => {
    const response = await api.put(`/materials/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  deleteMaterial: async (id) => {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  }
};

export default materialService;
