import api from './api';

const getUsers = async (params) => {
  const response = await api.get('/users', { params });
  return response.data;
};

const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

const exportUsers = async (params) => {
  const response = await api.get('/users/export', {
    params,
    responseType: 'blob', // Important for downloading files
  });
  return response.data;
};

const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  exportUsers
};

export default userService;
