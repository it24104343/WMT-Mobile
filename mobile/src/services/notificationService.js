import apiClient from '../utils/api';

const notificationService = {
  // Get all notifications
  getAllNotifications: async (page = 1) => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get notification by ID
  getNotification: async (id) => {
    try {
      const response = await apiClient.get(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new notification
  createNotification: async (notificationData) => {
    try {
      const response = await apiClient.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update notification
  updateNotification: async (id, notificationData) => {
    try {
      const response = await apiClient.put(`/notifications/${id}`, notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete notification
  deleteNotification: async (id) => {
    try {
      const response = await apiClient.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await apiClient.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread/count');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default notificationService;
