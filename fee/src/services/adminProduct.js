import api from './api';

// Lấy danh sách sản phẩm
export const getProducts = async (page = 1, limit = 10, token) => {
  try {
    console.log('Fetching products with params:', { page, limit });
    const response = await api.get(`/products?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Products response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Thêm sản phẩm mới
export const createProduct = async (data, token) => {
  try {
    console.log('Creating product with data:', data);
    const response = await api.post('/products', data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Create product response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Cập nhật sản phẩm
export const updateProduct = async (id, data, token) => {
  try {
    console.log('Updating product:', { id, data });
    const response = await api.put(`/products/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Update product response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Xóa sản phẩm
export const deleteProduct = async (id, token) => {
  try {
    console.log('Deleting product:', id);
    const response = await api.delete(`/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Delete product response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Xóa hình ảnh sản phẩm
export const deleteProductImage = async (id, imageId, token) => {
  try {
    console.log('Deleting product image:', { id, imageId });
    const response = await api.delete(`/products/${id}/images/${imageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Delete image response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting product image:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Thêm biến thể sản phẩm
export const addProductVariants = async (productId, variants, token) => {
  try {
    console.log('Adding product variants:', { productId, variants });
    const response = await api.post(
      `/products/${productId}/variants`,
      variants,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('Add variants response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding product variants:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Cập nhật biến thể sản phẩm
export const updateProductVariant = async (productId, variantId, data, token) => {
  try {
    console.log('Updating product variant:', { productId, variantId, data });
    const response = await api.put(
      `/products/${productId}/variants/${variantId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('Update variant response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating product variant:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Xóa biến thể sản phẩm
export const deleteProductVariant = async (productId, variantId, token) => {
  try {
    console.log('Deleting product variant:', { productId, variantId });
    const response = await api.delete(
      `/products/${productId}/variants/${variantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('Delete variant response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting product variant:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Lấy thông tin chi tiết sản phẩm
export const getProductById = async (id, token) => {
  try {
    const response = await api.get(`/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};
