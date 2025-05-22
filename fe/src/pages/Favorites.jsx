import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { getFavorites, removeFromFavorites } from '../services/favorite';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import { showError, showSuccess, NOTIFICATIONS } from '../utils/notification';
import useTitle from '../hooks/useTitle';

const Favorites = () => {
  // Set tiêu đề trang
  useTitle('Sản phẩm yêu thích');

  const navigate = useNavigate();
  const { token, user, loading } = useAuth();
  const {
    data: favorites,
    loading: favoritesLoading,
    error: favoritesError,
    callApi: fetchFavorites,
  } = useApi();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      showError(NOTIFICATIONS.auth.loginRequired);
      navigate('/login');
      return;
    }
    fetchFavorites(getFavorites, token);
  }, [token, user, loading, navigate, fetchFavorites]);

  const handleRemoveFromFavorites = async (productId) => {
    try {
      await removeFromFavorites(productId, token);
      showSuccess(NOTIFICATIONS.product.favoriteRemoveSuccess);
      await fetchFavorites(getFavorites, token);
    } catch (err) {
      showError(err, NOTIFICATIONS.common.deleteFailed);
    }
  };

  if (loading || favoritesLoading)
    return <div className="text-center mt-10">Đang tải...</div>;
  if (favoritesError)
    return (
      <div className="text-red-500 text-center mt-10">{favoritesError}</div>
    );
  if (!favorites || favorites.length === 0)
    return (
      <div className="text-center mt-10">
        Bạn chưa có sản phẩm yêu thích nào.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Sản phẩm yêu thích
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {favorites.map((favorite) => (
          <div key={favorite.product.id} className="relative">
            <ProductCard product={favorite.product} />
            <button
              onClick={() => handleRemoveFromFavorites(favorite.product.id)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
