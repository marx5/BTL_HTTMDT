import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
} from '../../services/favorite';
import Button from '../common/Button';
import { showError, showSuccess, NOTIFICATIONS } from '../../utils/notification';

const API_BASE_URL = 'http://localhost:3456';

const ProductCard = ({ product }) => {
  const { token, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && token) {
        try {
          const favorites = await getFavorites(token);
          const isInFavorites = favorites.some(
            (fav) => fav.product.id === product.id
          );
          setIsFavorited(isInFavorites);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [user, token, product.id]);

  const handleFavoriteClick = async () => {
    if (!user || !token) {
      showError(NOTIFICATIONS.auth.loginRequired);
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(product.id, token);
        setIsFavorited(false);
        showSuccess(NOTIFICATIONS.product.favoriteRemoveSuccess);
      } else {
        await addToFavorites(product.id, token);
        setIsFavorited(true);
        showSuccess(NOTIFICATIONS.product.favoriteAddSuccess);
      }
    } catch (error) {
      console.error('Error handling favorite:', error);
      showError(error, NOTIFICATIONS.common.operationFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductImage = () => {
    if (!product) return null;

    // Nếu có ProductImages
    if (product.ProductImages && product.ProductImages.length > 0) {
      const mainImage = product.ProductImages.find((img) => img.isMain);
      if (mainImage?.url) {
        // Loại bỏ dấu gạch chéo ở đầu và thư mục Uploads nếu có
        const cleanUrl = mainImage.url
          .replace(/^\/+/, '')
          .replace(/^Uploads\//, '');
        return mainImage.url.startsWith('http')
          ? mainImage.url
          : `${API_BASE_URL}/${cleanUrl}`;
      }
    }

    // Nếu có image trực tiếp
    if (product.image) {
      // Loại bỏ dấu gạch chéo ở đầu và thư mục Uploads nếu có
      const cleanUrl = product.image
        .replace(/^\/+/, '')
        .replace(/^Uploads\//, '');
      return product.image.startsWith('http')
        ? product.image
        : `${API_BASE_URL}/${cleanUrl}`;
    }

    return null;
  };

  if (!product) return null;

  return (
    <div
      className="w-48 h-[320px] bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary flex flex-col group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Nút yêu thích */}
      <button
        onClick={handleFavoriteClick}
        disabled={isLoading}
        className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-300 shadow-md
          ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'}
          ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Ảnh sản phẩm */}
      <div className="relative h-2/3 flex items-center justify-center bg-gray-50 overflow-hidden">
        {getProductImage() ? (
          <img
            src={getProductImage()}
            alt={product.name || 'Product image'}
            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">Không có hình ảnh</span>
          </div>
        )}
        {/* Badge giảm giá */}
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
            -{product.discount}%
          </span>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex-1 flex flex-col justify-between p-4 bg-white">
        <h3 className="font-semibold text-lg text-gray-900 truncate mb-2 min-h-[2.5rem]">{product.name || 'Unnamed Product'}</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-primary font-bold text-xl">
            {product.price ? product.price.toLocaleString('vi-VN') : '0'} VND
          </span>
          {product.discount > 0 && (
            <span className="text-sm text-gray-500 line-through">
              {(product.price * (1 + product.discount / 100)).toLocaleString('vi-VN')} VND
            </span>
          )}
        </div>
        <Link to={`/product/${product.id}`} className="block mt-auto">
          <Button variant="primary" className="w-full justify-center py-2 rounded-lg text-base font-semibold">
            Xem chi tiết
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
