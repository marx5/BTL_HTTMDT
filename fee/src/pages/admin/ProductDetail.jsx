import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { getProductById } from '../../services/adminProduct';
import Loader from '../../components/common/Loader';
import { Link } from 'react-router-dom';

const IMG_BASE_URL = process.env.REACT_APP_IMG_URL;


const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, loading, error, callApi: fetchProduct } = useApi();

  useEffect(() => {
    fetchProduct(() => getProductById(id));
  }, [id, fetchProduct]);

  if (loading)
    return (
      <div className="text-center mt-10">
        <Loader />
      </div>
    );
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!product)
    return <div className="text-center mt-10">Không tìm thấy sản phẩm</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Chi tiết sản phẩm
        </h2>
        <Link
          to="/admin/products"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Quay lại
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            {product.ProductImages && product.ProductImages.length > 0 ? (
              <img
                src={
                  product.ProductImages[0].url.startsWith('http')
                    ? product.ProductImages[0].url
                    : `${IMG_BASE_URL}${(product.ProductImages[0].url)}`
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">Không có hình ảnh</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-700">
              Tên sản phẩm
            </h3>
            <p className="mt-1 text-gray-900">{product.name}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700">Mô tả</h3>
            <p className="mt-1 text-gray-900">{product.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700">Giá</h3>
            <p className="mt-1 text-gray-900">
              {product.price.toLocaleString('vi-VN')} VND
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700">Danh mục</h3>
            <p className="mt-1 text-gray-900">
              {product.Category?.name || 'Không có'}
            </p>
          </div>

          {/* Product Variants */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Biến thể sản phẩm
            </h3>
            <div className="space-y-2">
              {product.ProductVariants &&
              product.ProductVariants.length > 0 ? (
                product.ProductVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{variant.size}</span>
                      <span className="mx-2">-</span>
                      <span className="font-medium">{variant.color}</span>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-gray-600">
                        {variant.stock} sản phẩm
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Không có biến thể nào</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
