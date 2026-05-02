import apiClient from '../utils/api';

const classService = {
  // Get all classes
  getAllClasses: async (page = 1, search = '') => {
    try {
      const response = await apiClient.get('/classes', {
        params: { page, search }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get class by ID
  getClass: async (id) => {
    try {
      const response = await apiClient.get(`/classes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new class
  createClass: async (classData) => {
    try {
      const response = await apiClient.post('/classes', classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update class
  updateClass: async (id, classData) => {
    try {
      const response = await apiClient.put(`/classes/${id}`, classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete class
  deleteClass: async (id) => {
    try {
      const response = await apiClient.delete(`/classes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get students in a class
  getClassStudents: async (classId) => {
    try {
      const response = await apiClient.get(`/classes/${classId}/students`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Assign student to class
  assignStudent: async (classId, studentId) => {
    try {
      const response = await apiClient.post(`/classes/${classId}/enroll`, { studentId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove student from class
  removeStudent: async (classId, studentId) => {
    try {
      const response = await apiClient.delete(`/classes/${classId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default classService;
