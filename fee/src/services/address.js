import api from './api';

export const getAddresses = async () => {
  const response = await api.get('/addresses');
  return response.data;
};

export const addAddress = async (data) => {
  const response = await api.post('/addresses', data);
  return response;
};

export const updateAddress = async (id, data) => {
  const response = await api.put(`/addresses/${id}`, data);
  return response;
};

export const deleteAddress = async (id) => {
  const response = await api.delete(`/addresses/${id}`);
  return response;
};

export const setDefaultAddress = async (id) => {
  const response = await api.put(`/addresses/${id}/default`, {});
  return response;
};
