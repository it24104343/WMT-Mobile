import apiClient from '../utils/api';

const teacherService = {
  // Get all teachers
  getAllTeachers: async (page = 1, search = '') => {
    try {
      const response = await apiClient.get('/teachers', {
        params: { page, search }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get teacher by ID
  getTeacher: async (id) => {
    try {
      const response = await apiClient.get(`/teachers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new teacher
  createTeacher: async (teacherData) => {
    try {
      const response = await apiClient.post('/teachers', teacherData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update teacher
  updateTeacher: async (id, teacherData) => {
    try {
      const response = await apiClient.put(`/teachers/${id}`, teacherData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    try {
      const response = await apiClient.delete(`/teachers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get teacher's classes
  getTeacherClasses: async (teacherId) => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}/classes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default teacherService;
