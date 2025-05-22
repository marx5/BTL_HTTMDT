import { useState, useEffect, useRef } from 'react';
import useTitle from '../hooks/useTitle';
import { getProducts } from '../services/product';
import { getCategories } from '../services/category';
import { getActiveBanners } from '../services/banner';
import ProductCard from '../components/product/ProductCard';
import Banner from '../components/banner/Banner';
import Loader from '../components/common/Loader';

const Home = () => {
  // Sử dụng hook useTitle để đặt tiêu đề cho trang
  useTitle('Trang chủ');
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Sử dụng ref để theo dõi xem đã fetch dữ liệu chưa
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    // Nếu đã fetch dữ liệu rồi thì không fetch lại
    if (dataFetchedRef.current) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsData, categoriesData, bannersData] = await Promise.all([
          getProducts(),
          getCategories(),
          getActiveBanners(),
        ]);

        setProducts(productsData);
        setCategories(categoriesData);
        setBanners(bannersData);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Đã xảy ra lỗi không xác định.');
      } finally {
        setLoading(false);
      }
      // Đánh dấu là đã fetch dữ liệu
      dataFetchedRef.current = true;
    };

    fetchData();
  }, []);

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
          ? 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
          : error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Banner */}
      <Banner banners={banners} />

      <div className="px-4 py-10">
        {/* Danh mục sản phẩm */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            Danh mục sản phẩm
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {categories &&
            Array.isArray(categories) &&
            categories.length > 0 ? (
              categories.map((category) => (
                <a
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="flex-shrink-0 px-4 py-2 bg-neutral text-gray-700 rounded-full hover:bg-primary hover:text-white transition"
                >
                  {category.name}
                </a>
              ))
            ) : (
              <p className="text-gray-500">
                Không có danh mục nào để hiển thị.
              </p>
            )}
          </div>
        </div>

        {/* Sản phẩm nổi bật */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-2 border-b border-gray-200">
            Sản phẩm nổi bật
          </h1>
          {products && Array.isArray(products) && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Không có sản phẩm nào để hiển thị.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
