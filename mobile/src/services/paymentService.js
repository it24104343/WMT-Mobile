import apiClient from '../utils/api';

const paymentService = {
  // Get all payments
  getAllPayments: async (page = 1, search = '') => {
    try {
      const response = await apiClient.get('/payments', {
        params: { page, search }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get payment by ID
  getPayment: async (id) => {
    try {
      const response = await apiClient.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Record a payment
  createPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update payment
  updatePayment: async (id, paymentData) => {
    try {
      const response = await apiClient.put(`/payments/${id}`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete payment
  deletePayment: async (id) => {
    try {
      const response = await apiClient.delete(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get student's payment history
  getStudentPayments: async (studentId) => {
    try {
      const response = await apiClient.get(`/payments`, {
        params: { studentId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get payment statistics
  getPaymentStats: async () => {
    try {
      const response = await apiClient.get('/payments/statistics');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default paymentService;
