import apiClient from '../utils/api';

const serviceRequestService = {
  // Get all service requests
  getAllRequests: async (page = 1, status = '') => {
    try {
      const response = await apiClient.get('/service-requests', {
        params: { page, status }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get request by ID
  getRequest: async (id) => {
    try {
      const response = await apiClient.get(`/service-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new service request
  createRequest: async (requestData) => {
    try {
      const response = await apiClient.post('/service-requests', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update service request
  updateRequest: async (id, requestData) => {
    try {
      const response = await apiClient.put(`/service-requests/${id}`, requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete service request
  deleteRequest: async (id) => {
    try {
      const response = await apiClient.delete(`/service-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update request status
  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.put(`/service-requests/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student's requests
  getStudentRequests: async (studentId) => {
    try {
      const response = await apiClient.get(`/service-requests`, {
        params: { studentId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default serviceRequestService;
