import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { getProducts } from '../../services/product';
import ProductCard from './ProductCard';
import Loader from '../common/Loader';

const ProductList = ({ categoryId }) => {
  const [sortBy, setSortBy] = useState('newest');
  const { data: products, loading, error, callApi: fetchProducts } = useApi();

  useEffect(() => {
    fetchProducts(() => getProducts(categoryId));
  }, [categoryId, fetchProducts]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const sortedProducts = products
    ? [...products].sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          default:
            return 0;
        }
      })
    : [];

  if (loading)
    return (
      <div className="text-center mt-10">
        <Loader />
      </div>
    );

  if (error) {
    return (
      <div className="text-red-500 text-center mt-10">
        {error === 'Đã xảy ra lỗi không xác định.'
          ? 'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.'
          : error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          {categoryId ? 'Sản phẩm theo danh mục' : 'Tất cả sản phẩm'}
        </h1>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sắp xếp theo:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={handleSortChange}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
          </select>
        </div>
      </div>

      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedProducts.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">Không có sản phẩm nào để hiển thị.</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
