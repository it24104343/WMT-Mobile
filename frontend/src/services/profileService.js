import api from './api';

const profileService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Update current user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  // Upload user profile image
  uploadImage: async (formData) => {
    const response = await api.post('/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete current user profile
  deleteProfile: async () => {
    const response = await api.delete('/profile');
    return response.data;
  }
};

export default profileService;
