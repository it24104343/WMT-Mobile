import api from './api';

const attendanceService = {
  // Sessions
  getSessions: async (params = {}) => {
    const response = await api.get('/attendance/sessions', { params });
    return response.data;
  },

  createSession: async (data) => {
    const response = await api.post('/attendance/sessions', data);
    return response.data;
  },

  getSessionAttendance: async (sessionId) => {
    const response = await api.get(`/attendance/sessions/${sessionId}`);
    return response.data;
  },

  markAttendance: async (sessionId, records) => {
    const response = await api.put(`/attendance/sessions/${sessionId}/mark`, { records });
    return response.data;
  },

  updateSession: async (sessionId, data) => {
    const response = await api.put(`/attendance/sessions/${sessionId}`, data);
    return response.data;
  },

  cancelSession: async (sessionId) => {
    const response = await api.delete(`/attendance/sessions/${sessionId}`);
    return response.data;
  },

  // Reports
  getStudentReport: async (studentId, params = {}) => {
    const response = await api.get(`/attendance/report/student/${studentId}`, { params });
    return response.data;
  },

  getClassReport: async (classId, params = {}) => {
    const response = await api.get(`/attendance/report/class/${classId}`, { params });
    return response.data;
  },

  // Teacher Attendance
  markTeacherAttendance: async (data) => {
    const response = await api.post('/teacher-attendance', data);
    return response.data;
  },

  getTeacherAttendance: async (params = {}) => {
    const response = await api.get('/teacher-attendance', { params });
    return response.data;
  },

  getDailyTeacherAttendance: async (date) => {
    const response = await api.get('/teacher-attendance/daily', { params: { date } });
    return response.data;
  },

  markBulkTeacherAttendance: async (data) => {
    const response = await api.post('/teacher-attendance/bulk', data);
    return response.data;
  },

  deleteTeacherAttendanceRecord: async (id) => {
    const response = await api.delete(`/teacher-attendance/${id}`);
    return response.data;
  },

  deleteDayTeacherAttendance: async (date) => {
    const response = await api.delete(`/teacher-attendance/date/${date}`);
    return response.data;
  }
};

export default attendanceService;
