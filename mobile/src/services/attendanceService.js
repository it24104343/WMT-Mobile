import apiClient from '../utils/api';

const attendanceService = {
  // Get all attendance records
  getAllAttendance: async (page = 1, classId = '') => {
    try {
      const response = await apiClient.get('/attendance', {
        params: { page, classId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get attendance by ID
  getAttendance: async (id) => {
    try {
      const response = await apiClient.get(`/attendance/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark attendance
  markAttendance: async (attendanceData) => {
    try {
      const response = await apiClient.post('/attendance', attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update attendance
  updateAttendance: async (id, attendanceData) => {
    try {
      const response = await apiClient.put(`/attendance/${id}`, attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get class attendance
  getClassAttendance: async (classId, date = '') => {
    try {
      const response = await apiClient.get(`/attendance`, {
        params: { classId, date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student attendance record
  getStudentAttendance: async (studentId) => {
    try {
      const response = await apiClient.get(`/attendance/student/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get attendance percentage
  getAttendancePercentage: async (studentId, classId) => {
    try {
      const response = await apiClient.get(`/attendance/percentage`, {
        params: { studentId, classId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default attendanceService;
