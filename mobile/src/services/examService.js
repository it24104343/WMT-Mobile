import apiClient from '../utils/api';

const examService = {
  // Get all exams
  getAllExams: async (page = 1, search = '') => {
    try {
      const response = await apiClient.get('/exams', {
        params: { page, search }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get exam by ID
  getExam: async (id) => {
    try {
      const response = await apiClient.get(`/exams/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new exam
  createExam: async (examData) => {
    try {
      const response = await apiClient.post('/exams', examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update exam
  updateExam: async (id, examData) => {
    try {
      const response = await apiClient.put(`/exams/${id}`, examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete exam
  deleteExam: async (id) => {
    try {
      const response = await apiClient.delete(`/exams/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Enter marks for an exam
  enterMarks: async (examId, marksData) => {
    try {
      const response = await apiClient.post(`/exams/${examId}/marks`, marksData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get exam results
  getExamResults: async (examId) => {
    try {
      const response = await apiClient.get(`/exams/${examId}/results`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student's exam performance
  getStudentPerformance: async (studentId) => {
    try {
      const response = await apiClient.get(`/exams/student/${studentId}/performance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default examService;
