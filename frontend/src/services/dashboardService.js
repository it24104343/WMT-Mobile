import api from './api';

const dashboardService = {
  getAdminDashboard: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },
  getTeacherDashboard: async () => {
    const response = await api.get('/dashboard/teacher');
    return response.data;
  },
  getStudentDashboard: async () => {
    const response = await api.get('/dashboard/student');
    return response.data;
  },
  getRevenueSummary: async (params = {}) => {
    const response = await api.get('/revenue/summary', { params });
    return response.data;
  },
  getTeacherEarnings: async (params = {}) => {
    const response = await api.get('/revenue/teacher-earnings', { params });
    return response.data;
  }
};

export default dashboardService;
