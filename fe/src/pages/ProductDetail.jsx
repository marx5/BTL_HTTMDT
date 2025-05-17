import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useApi from '../hooks/useApi';
import { getProductById } from '../services/product';
import { buyNow } from '../services/order';
import { fetchAddresses } from '../redux/slices/addressSlice';
import { useAuth } from '../context/AuthContext';
import useCart from '../hooks/useCart';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { showSuccess, showError } from '../utils/notification';
import AddressForm from '../components/address/AddressForm';
import AddressList from '../components/address/AddressList';
import useTitle from '../hooks/useTitle';

const API_BASE_URL = 'http://localhost:3456';

const cleanImageUrl = (url) => {
  return url.replace(/^\/+/, '').replace(/^Uploads\//, '');
};

const ProductDetail = () => {
  // Set tiêu đề trang
  useTitle('Chi tiết sản phẩm');
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user, loading } = useAuth();
  const { addToCart } = useCart();
  const addressState = useSelector(state => state.address);
  const addresses = addressState.data;
  const addressesLoading = addressState.loading;
  const addressesError = addressState.error;
  
  const {
    data: product,
    loading: productLoading,
    error: productError,
    callApi: fetchProduct,
  } = useApi();
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addressId, setAddressId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [error, setError] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    fetchProduct(getProductById, id);
    if (loading) return;
    if (token && user) {
      dispatch(fetchAddresses());
    }
  }, [id, token, user, loading, fetchProduct, dispatch]);

  useEffect(() => {
    if (product?.ProductVariants?.length > 0) {
      setSelectedVariant(product.ProductVariants[0]);
    }
    if (addresses?.length > 0) {
      setAddressId(addresses[0].id);
    }
  }, [product, addresses]);

  useEffect(() => {
    if (product?.ProductImages?.length > 0) {
      const mainImage = product.ProductImages.find((img) => img.isMain);
      setSelectedImage(mainImage || product.ProductImages[0]);
    }
  }, [product]);

  // Dynamic title based on product name
  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} - Fashion Store`;
    }
  }, [product?.name]);

  const handleBuyNow = async () => {
    if (loading) return;
    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (!selectedVariant) {
      setError('Vui lòng chọn biến thể sản phẩm.');
      showError('Vui lòng chọn biến thể sản phẩm.');
      return;
    }
    
    if (!addressId) {
      setError('Vui lòng chọn địa chỉ giao hàng.');
      showError('Vui lòng chọn địa chỉ giao hàng.');
      return;
    }

    // Thay vì tạo đơn hàng ngay, chuyển đến trang checkout
    try {
      setIsBuyingNow(true);
      
      // Lưu thông tin sản phẩm vào localStorage để sử dụng ở trang checkout
      const checkoutItem = {
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: quantity,
        addressId: addressId,
        productInfo: {
          name: product.name,
          price: selectedVariant.price || product.price,
          image: product.ProductImages?.[0]?.url ? 
            (product.ProductImages[0].url.startsWith('http') 
              ? product.ProductImages[0].url 
              : `${API_BASE_URL}/${cleanImageUrl(product.ProductImages[0].url)}`)
            : null,
          variantInfo: {
            size: selectedVariant.size,
            color: selectedVariant.color,
            stock: selectedVariant.stock
          }
        },
        fromBuyNow: true,
        timestamp: Date.now()
      };
      
      // Lưu vào localStorage
      localStorage.setItem('buyNowItem', JSON.stringify(checkoutItem));
      
      // Chuyển hướng đến trang checkout
      navigate('/checkout?from=buynow');
    } catch (err) {
      setError('Không thể chuyển đến trang thanh toán');
      showError('Có lỗi xảy ra', 'Không thể chuyển đến trang thanh toán');
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user || !token) {
      showError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      return;
    }

    if (!selectedVariant) {
      showError('Vui lòng chọn biến thể sản phẩm.');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      // Không cần toast.success ở đây vì đã được xử lý trong context
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Không cần toast.error ở đây vì đã được xử lý trong context
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading || productLoading || addressesLoading)
    return (
      <div className="text-center mt-10">
        <Loader />
      </div>
    );
  if (productError || addressesError)
    return (
      <div className="text-red-500 text-center mt-10">
        {productError || addressesError}
      </div>
    );
  if (!product)
    return <div className="text-center mt-10">Không tìm thấy sản phẩm</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg max-w-[500px] mx-auto">
            {selectedImage ? (
              <img
                src={
                  selectedImage.url.startsWith('http')
                    ? selectedImage.url
                    : `${API_BASE_URL}/${cleanImageUrl(selectedImage.url)}`
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

          {/* Thumbnail Images */}
          {product.ProductImages?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 max-w-[400px] mx-auto px-4">
              {product.ProductImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                    selectedImage?.id === image.id
                      ? 'border-primary opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={
                      image.url.startsWith('http')
                        ? image.url
                        : `${API_BASE_URL}/${cleanImageUrl(image.url)}`
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name || 'Unnamed Product'}
          </h1>
          <p className="text-2xl text-primary mb-4">
            {product.price ? product.price.toLocaleString('vi-VN') : '0'} VND
          </p>
          {product.discount > 0 && (
            <p className="text-lg text-gray-500 line-through mb-4">
              {(product.price * (1 + product.discount / 100)).toLocaleString(
                'vi-VN'
              )}{' '}
              VND
            </p>
          )}
          <p className="text-gray-600 mb-6">
            {product.description || 'No description'}
          </p>

          {/* Variant Selection */}
          {product.ProductVariants?.length > 0 && (
            <div className="mb-6">
              {/* Size Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kích thước:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(product.ProductVariants.map((v) => v.size))].map(
                    (size) => (
                      <button
                        key={size}
                        onClick={() => {
                          const variantsWithSize =
                            product.ProductVariants.filter(
                              (v) => v.size === size
                            );
                          setSelectedVariant(variantsWithSize[0]);
                        }}
                        className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                          selectedVariant?.size === size
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-primary'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Color Selection */}
              {selectedVariant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Màu sắc:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.ProductVariants.filter(
                      (v) => v.size === selectedVariant.size
                    ).map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                          selectedVariant?.id === variant.id
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{variant.color}</span>
                          <span className="text-sm text-gray-500">
                            ({variant.stock})
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng:
            </label>
            <div className="flex items-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 border rounded-l-md hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={selectedVariant?.stock || 1}
                value={quantity}
                onChange={(e) => {
                  const value = Math.min(
                    Math.max(1, parseInt(e.target.value) || 1),
                    selectedVariant?.stock || 1
                  );
                  setQuantity(value);
                }}
                className="w-16 text-center border-t border-b py-1"
              />
              <button
                onClick={() =>
                  setQuantity(
                    Math.min(selectedVariant?.stock || 1, quantity + 1)
                  )
                }
                className="px-3 py-1 border rounded-r-md hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ giao hàng:
            </label>
            {token && user ? (
              <div className="space-y-4">
                {showAddressForm ? (
                  <AddressForm
                    onSuccess={() => {
                      setShowAddressForm(false);
                      showSuccess('Đã thêm địa chỉ mới');
                      dispatch(fetchAddresses());
                    }}
                    onCancel={() => setShowAddressForm(false)}
                  />
                ) : (
                  <>
                    <AddressList
                      addresses={addresses || []}
                      selectedAddress={addressId}
                      onSelectAddress={(address) => setAddressId(address.id)}
                    />
                    <Button
                      onClick={() => setShowAddressForm(true)}
                      className="mt-4"
                      variant="outline"
                    >
                      + Thêm địa chỉ mới
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-500">
                  Vui lòng đăng nhập để chọn địa chỉ giao hàng.
                </p>
                <Button variant="primary" onClick={() => navigate('/login')}>
                  Đăng nhập
                </Button>
              </div>
            )}
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          <Button
            variant="primary"
            className="w-full"
            onClick={handleBuyNow}
            disabled={isBuyingNow || !selectedVariant}
          >
            {isBuyingNow ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Đang xử lý...</span>
              </div>
            ) : (
              'Mua ngay'
            )}
          </Button>

          <Button
            variant="primary"
            className="w-full mt-2"
            onClick={handleAddToCart}
            disabled={isAddingToCart || !selectedVariant}
          >
            {isAddingToCart ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Đang thêm...</span>
              </div>
            ) : (
              'Thêm vào giỏ hàng'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
