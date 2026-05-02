import api from './api';

const serviceRequestService = {
  getServiceRequests: async (params = {}) => {
    const response = await api.get('/service-requests', { params });
    return response.data;
  },
  getServiceRequestById: async (id) => {
    const response = await api.get(`/service-requests/${id}`);
    return response.data;
  },
  createServiceRequest: async (data) => {
    const response = await api.post('/service-requests', data);
    return response.data;
  },
  updateServiceRequest: async (id, data) => {
    const response = await api.put(`/service-requests/${id}`, data);
    return response.data;
  }
};

export default serviceRequestService;
