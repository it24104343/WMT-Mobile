import api from './api';

const enrollmentService = {
  getEnrollments: async (params = {}) => {
    const response = await api.get('/enrollments', { params });
    return response.data;
  },

  getStudentEnrollments: async (studentId) => {
    const response = await api.get(`/enrollments/student/${studentId}`);
    return response.data;
  },

  getClassEnrollments: async (classId) => {
    const response = await api.get(`/enrollments/class/${classId}`);
    return response.data;
  },

  createEnrollment: async (data) => {
    const response = await api.post('/enrollments', data);
    return response.data;
  },

  bulkEnroll: async (data) => {
    const response = await api.post('/enrollments/bulk', data);
    return response.data;
  },

  unenrollStudent: async (enrollmentId) => {
    const response = await api.put(`/enrollments/${enrollmentId}/unenroll`);
    return response.data;
  },

  selfEnroll: async (classId) => {
    const response = await api.post('/enrollments/self-enroll', { classId });
    return response.data;
  }
};

export default enrollmentService;
