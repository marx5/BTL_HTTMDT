import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { searchProducts } from '../services/product';
import ProductCard from '../components/product/ProductCard';
import useTitle from '../hooks/useTitle';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: products, loading, error, callApi } = useApi();
  const query = new URLSearchParams(location.search).get('q') || '';

  // Đặt tiêu đề trang với từ khóa tìm kiếm
  useTitle(`Tìm kiếm: ${query}`);

  useEffect(() => {
    if (query) {
      callApi(searchProducts, query);
    }
  }, [query, callApi]);

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!products || products.length === 0)
    return (
      <div className="text-center mt-10">Không tìm thấy sản phẩm nào.</div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Kết quả tìm kiếm cho `{query}`
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Search;
