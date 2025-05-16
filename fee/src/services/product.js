import api from './api';

const API_BASE_URL = 'http://localhost:3456';

const cleanImageUrl = (url) => {
  if (!url) return null;
  return url.replace(/^\/+/, '').replace(/^Uploads\//, '');
};

const processProductImages = (product) => {
  if (!product.ProductImages || !Array.isArray(product.ProductImages)) {
    return {
      ...product,
      image: null,
      images: [],
    };
  }

  const images = product.ProductImages.map((img) => ({
    ...img,
    url: img.url ? `${API_BASE_URL}/uploads/${cleanImageUrl(img.url)}` : null,
  }));

  const mainImage = images.find((img) => img.isMain) || images[0];

  return {
    ...product,
    image: mainImage?.url || null,
    images: images,
  };
};

export const getProducts = async (categoryId = null) => {
  try {
    let response;
    if (categoryId) {
      const parsedId = parseInt(categoryId);
      if (isNaN(parsedId)) {
        throw new Error('categoryId must be a number');
      }
      response = await api.get(`/products/category/${parsedId}`);
    } else {
      response = await api.get('/products');
    }
    const products = Array.isArray(response.data.products)
      ? response.data.products
      : [];
    return products.map(processProductImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return processProductImages(response.data);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const searchProducts = async (query) => {
  try {
    const response = await api.get('/products/search', {
      params: { q: query },
    });
    const products = Array.isArray(response.data.products)
      ? response.data.products
      : [];
    return products.map(processProductImages);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};
