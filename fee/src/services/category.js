import api from './api';

export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
