import api from './api';

const API_BASE_URL = 'http://localhost:3456';

const cleanImageUrl = (url) => {
  if (!url) return null;
  return url.replace(/\\/g, '/').replace(/^uploads\//, '');
};

const processBannerImages = (banner) => {
  if (!banner) return null;
  const processedBanner = {
    ...banner,
    imageUrl: banner.imageUrl
      ? `${API_BASE_URL}/uploads/${cleanImageUrl(banner.imageUrl)}`
      : null,
  };
  return processedBanner;
};

export const getActiveBanners = async () => {
  try {
    const response = await api.get('/banners/active');
    const banners = Array.isArray(response.data.data) ? response.data.data : [];
    const processedBanners = banners.map(processBannerImages);
    return processedBanners;
  } catch (error) {
    return [];
  }
};
