import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import useTitle from '../hooks/useTitle';
import { getCategories } from '../services/category';
import ProductList from '../components/product/ProductList';
import Loader from '../components/common/Loader';

const Products = () => {
  const { categoryId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState(categoryId || null);
  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
    callApi: fetchCategories,
  } = useApi();

  // Set tiêu đề trang
  useTitle('Sản phẩm');
  
  // Fetch categories
  useEffect(() => {
    fetchCategories(getCategories);
  }, [fetchCategories]);

  if (categoriesLoading)
    return (
      <div className="text-center mt-10">
        <Loader />
      </div>
    );

  if (categoriesError) {
    return (
      <div className="text-red-500 text-center mt-10">
        {categoriesError === 'Đã xảy ra lỗi không xác định.'
          ? 'Không thể tải danh mục. Vui lòng thử lại sau.'
          : categoriesError}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Danh mục sản phẩm */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Danh mục sản phẩm
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full transition ${
              !selectedCategory
                ? 'bg-primary text-white'
                : 'bg-neutral text-gray-700 hover:bg-primary hover:text-white'
            }`}
          >
            Tất cả
          </button>
          {categories &&
            categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full transition ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-neutral text-gray-700 hover:bg-primary hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <ProductList categoryId={selectedCategory} />
    </div>
  );
};

export default Products;
