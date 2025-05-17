import api from './api';

export const getCategories = async (page = 1, limit = 100, token) => {
  try {
    console.log('Fetching categories with params:', { page, limit });
    const response = await api.get(`/categories?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Categories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const createCategory = async (data, token) => {
  try {
    console.log('Creating category with data:', data);
    const response = await api.post('/categories', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Create category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const updateCategory = async (id, data, token) => {
  try {
    console.log('Updating category:', { id, data });
    const response = await api.put(`/categories/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Update category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const deleteCategory = async (id, token) => {
  try {
    console.log('Deleting category:', id);
    const response = await api.delete(`/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Delete category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};
