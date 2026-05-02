import api from './api';

const paymentService = {
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getStudentPayments: async (studentId, params = {}) => {
    const response = await api.get(`/payments/student/${studentId}`, { params });
    return response.data;
  },

  getClassPaymentSummary: async (classId, params) => {
    const response = await api.get(`/payments/class/${classId}/summary`, { params });
    return response.data;
  },

  recordPayment: async (data) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  processGatewayPayment: async (data) => {
    const response = await api.post('/payments/gateway', data);
    return response.data;
  },

  refundPayment: async (paymentId) => {
    const response = await api.put(`/payments/${paymentId}/refund`);
    return response.data;
  },

  submitBankTransfer: async (formData) => {
    const response = await api.post('/payments/bank-transfer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  approveBankTransfer: async (paymentId, action) => {
    const response = await api.put(`/payments/${paymentId}/approve-transfer`, { action });
    return response.data;
  },
  
  processTeacherGatewayPayment: async (data) => {
    const response = await api.post('/payments/teacher/gateway', data);
    return response.data;
  },

  submitTeacherBankTransfer: async (formData) => {
    const response = await api.post('/payments/teacher/bank-transfer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updatePayment: async (paymentId, data) => {
    const response = await api.put(`/payments/${paymentId}`, data);
    return response.data;
  },
  
  deletePayment: async (paymentId) => {
    const response = await api.delete(`/payments/${paymentId}`);
    return response.data;
  }
};

export default paymentService;
