import api from './api';

const examService = {
  getExams: async (params = {}) => {
    const response = await api.get('/exams', { params });
    return response.data;
  },
  getExamById: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },
  createExam: async (data) => {
    const response = await api.post('/exams', data);
    return response.data;
  },
  updateExam: async (id, data) => {
    const response = await api.put(`/exams/${id}`, data);
    return response.data;
  },
  deleteExam: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },
  togglePublish: async (id) => {
    const response = await api.put(`/exams/${id}/publish`);
    return response.data;
  },
  toggleResultsPublish: async (id) => {
    const response = await api.put(`/exams/${id}/results`);
    return response.data;
  },
  getResults: async (id) => {
    const response = await api.get(`/exams/${id}/results`);
    return response.data;
  },
  // Questions
  addQuestion: async (examId, data) => {
    const response = await api.post(`/exams/${examId}/questions`, data);
    return response.data;
  },
  updateQuestion: async (examId, questionId, data) => {
    const response = await api.put(`/exams/${examId}/questions/${questionId}`, data);
    return response.data;
  },
  deleteQuestion: async (examId, questionId) => {
    const response = await api.delete(`/exams/${examId}/questions/${questionId}`);
    return response.data;
  },
  // Attempts
  startAttempt: async (examId, data) => {
    const response = await api.post(`/exams/${examId}/attempt`, data);
    return response.data;
  },
  submitAttempt: async (examId, data) => {
    const response = await api.put(`/exams/${examId}/attempt/submit`, data);
    return response.data;
  },
  getAttempt: async (examId, studentId) => {
    const response = await api.get(`/exams/${examId}/attempt/${studentId}`);
    return response.data;
  },
  gradeAttempt: async (examId, studentId, data) => {
    const response = await api.put(`/exams/${examId}/attempt/${studentId}/grade`, data);
    return response.data;
  },

  getStudentMarks: async (classId) => {
    const response = await api.get(`/exams/class/${classId}/student-marks`);
    return response.data;
  }
};

export default examService;
