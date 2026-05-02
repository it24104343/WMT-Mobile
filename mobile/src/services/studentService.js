import apiClient from '../utils/api';

const studentService = {
  // Get all students
  getAllStudents: async (page = 1, search = '') => {
    try {
      const response = await apiClient.get('/students', {
        params: { page, search }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student by ID
  getStudent: async (id) => {
    try {
      const response = await apiClient.get(`/students/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new student
  createStudent: async (studentData) => {
    try {
      const response = await apiClient.post('/students', studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update student
  updateStudent: async (id, studentData) => {
    try {
      const response = await apiClient.put(`/students/${id}`, studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete student
  deleteStudent: async (id) => {
    try {
      const response = await apiClient.delete(`/students/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search students
  searchStudents: async (query) => {
    try {
      const response = await apiClient.get('/students', {
        params: { search: query }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student's classes
  getStudentClasses: async (studentId) => {
    try {
      const response = await apiClient.get(`/students/${studentId}/classes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Pay registration fee
  payRegistrationFee: async (id) => {
    try {
      const response = await apiClient.put(`/students/${id}/pay-registration`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default studentService;
