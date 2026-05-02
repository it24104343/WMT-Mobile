import api from './api';

const teacherService = {
  // Get all teachers
  getTeachers: async (params = {}) => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },

  // Get single teacher by ID
  getTeacherById: async (id) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  // Create new teacher
  createTeacher: async (teacherData) => {
    const response = await api.post('/teachers', teacherData);
    return response.data;
  },

  // Update teacher
  updateTeacher: async (id, teacherData) => {
    const response = await api.put(`/teachers/${id}`, teacherData);
    return response.data;
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  // Confirm registration payment
  confirmTeacherPayment: async (id) => {
    const response = await api.put(`/teachers/${id}/confirm-payment`);
    return response.data;
  },

  // Export teachers
  exportTeachers: async (params) => {
    const response = await api.get('/teachers/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
};

export default teacherService;
