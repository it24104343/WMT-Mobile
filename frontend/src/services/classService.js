import api from './api';

const classService = {
  // Get all classes with pagination and filters
  getClasses: async (params = {}) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },

  // Get single class by ID
  getClassById: async (id) => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  // Create new class
  createClass: async (classData) => {
    const response = await api.post('/classes', classData);
    return response.data;
  },

  // Update class
  updateClass: async (id, classData) => {
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
  },

  // Delete class (soft delete)
  deleteClass: async (id) => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  // Assign teacher to class
  assignTeacher: async (classId, teacherId) => {
    const response = await api.put(`/classes/${classId}/assign-teacher`, { teacherId });
    return response.data;
  },

  // Add students to class
  addStudents: async (classId, studentIds) => {
    const response = await api.put(`/classes/${classId}/add-students`, { studentIds });
    return response.data;
  },

  // Remove students from class
  removeStudents: async (classId, studentIds) => {
    const response = await api.put(`/classes/${classId}/remove-students`, { studentIds });
    return response.data;
  },

  // Get timetable data
  getTimetable: async (params = {}) => {
    const response = await api.get('/classes/timetable', { params });
    return response.data;
  },

  // Get filter options (grades, subjects)
  getFilterOptions: async () => {
    const response = await api.get('/classes/filter-options');
    return response.data;
  },

  // Check teacher availability
  checkTeacherAvailability: async (data) => {
    const response = await api.post('/classes/check-availability', data);
    return response.data;
  },

  toggleManualEnrollment: async (classId) => {
    const response = await api.put(`/classes/${classId}/toggle-enrollment`);
    return response.data;
  }
};

export default classService;
