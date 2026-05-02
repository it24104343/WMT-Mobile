import api from './api';

const studentService = {
  // Get all students
  getStudents: async (params = {}) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  // Get single student by ID
  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Create new student
  createStudent: async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  // Update student
  updateStudent: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  // Delete student
  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  // Get available grades
  getGrades: async () => {
    const response = await api.get('/students/grades');
    return response.data;
  },

  // Pay registration fee
  payRegistrationFee: async (id) => {
    const response = await api.put(`/students/${id}/pay-registration`);
    return response.data;
  },

  // Export students
  exportStudents: async (params) => {
    const response = await api.get('/students/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
};

export default studentService;
