import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useCart from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { createOrder, buyNow } from '../services/order';
import { createCodPayment, createVNPayPayment, createMomoPayment } from '../services/payment';
import Button from '../components/common/Button';
import AddressForm from '../components/address/AddressForm';
import useTitle from '../hooks/useTitle';
import { fetchAddresses } from '../redux/slices/addressSlice';
import { showSuccess, showError } from '../utils/notification';
import { getProductById } from '../services/product';
import Loader from '../components/common/Loader';

const Checkout = () => {
  // Set tiêu đề trang
  useTitle('Thanh toán');

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isBuyNow = searchParams.get('from') === 'buynow';
  
  const dispatch = useDispatch();
  const { cart, loading: cartLoading, selectedItems } = useCart();
  const { user, loading: authLoading, isAuthenticated, token } = useAuth();
  const addressState = useSelector(state => state.address);
  const userAddresses = addressState.data;
  const addressesLoading = addressState.loading;
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [buyNowProduct, setBuyNowProduct] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeoutLoading, setTimeoutLoading] = useState(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false); // Biến kiểm soát để đảm bảo chỉ gọi fetchAddresses 1 lần

  // 30-minute timeout for buyNow
  const BUY_NOW_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Thêm timeout để tránh loading vô hạn
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (authLoading || cartLoading || addressesLoading || (isBuyNow && buyNowLoading)) {
        console.log("Loading timeout triggered");
        setTimeoutLoading(true);
        showError("Tải dữ liệu quá lâu, vui lòng làm mới trang");
      }
    }, 15000); // 15 giây timeout

    return () => clearTimeout(loadingTimeout);
  }, [authLoading, cartLoading, addressesLoading, isBuyNow, buyNowLoading]);

  // Function to fetch product details when needed
  const fetchProductDetails = async (productId, variantId, quantity) => {
    try {
      // Thêm timeout cho API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const fetchPromise = getProductById(productId);
      
      // Race giữa API call và timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response || !response.ProductVariants) {
        throw new Error('Không tìm thấy thông tin sản phẩm');
      }
      
      setBuyNowProduct(response);
      
      // Chọn variant tương ứng
      const selectedVariant = response.ProductVariants.find(
        variant => variant.id === variantId
      );
      
      if (!selectedVariant) {
        throw new Error('Không tìm thấy biến thể sản phẩm');
      }
      
      // Cập nhật thông tin chi tiết
      setBuyNowItem(prev => ({
        ...prev,
        variant: selectedVariant,
        product: response,
        quantity: quantity
      }));

      return response;
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(error.message || 'Không thể tải thông tin sản phẩm');
      showError(error.message || 'Không thể tải thông tin sản phẩm');
      return null;
    }
  };

  // Debug - chỉ chạy khi giá trị thực sự thay đổi
  useEffect(() => {
    console.log("Debug log run");
    console.log("Cart loading:", cartLoading);
    console.log("Auth loading:", authLoading);
    console.log("Address loading:", addressesLoading);
    console.log("BuyNow loading:", buyNowLoading);
    console.log("Is buy now:", isBuyNow);
    console.log("Selected items:", selectedItems?.length);
    console.log("Cart items count:", cart?.length);
    console.log("Addresses count:", userAddresses?.length);
    console.log("Selected address:", selectedAddress);
  }, [cartLoading, authLoading, addressesLoading, buyNowLoading, isBuyNow, 
      selectedItems?.length, cart?.length, userAddresses, userAddresses?.length, selectedAddress]);

  // Lấy thông tin sản phẩm mua ngay từ localStorage nếu có
  useEffect(() => {
    if (isBuyNow) {
      try {
        const storedItem = localStorage.getItem('buyNowItem');
        console.log("Buy Now stored item:", storedItem);
        
        if (!storedItem) {
          showError('Không tìm thấy thông tin sản phẩm');
          navigate('/products');
          return;
        }
        
        const parsedItem = JSON.parse(storedItem);
        if (!parsedItem || !parsedItem.productId || !parsedItem.variantId) {
          showError('Thông tin sản phẩm không hợp lệ');
          navigate('/products');
          return;
        }
        
        // Kiểm tra thời gian lưu, nếu quá 30 phút thì hủy
        const currentTime = Date.now();
        if (parsedItem.timestamp && (currentTime - parsedItem.timestamp > 30 * 60 * 1000)) {
          showError('Thông tin mua hàng đã hết hạn, vui lòng thử lại');
          localStorage.removeItem('buyNowItem');
          navigate('/products');
          return;
        }
        
        setBuyNowItem(parsedItem);
        
        // Nếu đã có thông tin sản phẩm trong localStorage, sử dụng luôn
        if (parsedItem.productInfo) {
          setBuyNowLoading(false);
          return;
        }
        
        // Nếu không có thông tin sản phẩm đầy đủ, tải từ API
        setBuyNowLoading(true);
        
        // Lấy thông tin sản phẩm từ API
        const fetchProductDetails = async () => {
          try {
            // Thêm timeout cho API call
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 10000)
            );
            
            const fetchPromise = getProductById(parsedItem.productId);
            
            // Race giữa API call và timeout
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            console.log("Product API response:", response);
            
            if (!response || !response.ProductVariants) {
              throw new Error('Không tìm thấy thông tin sản phẩm');
            }
            
            setBuyNowProduct(response);
            
            // Chọn variant tương ứng
            const selectedVariant = response.ProductVariants.find(
              variant => variant.id === parsedItem.variantId
            );
            
            if (!selectedVariant) {
              throw new Error('Không tìm thấy biến thể sản phẩm');
            }
            
            // Cập nhật thông tin chi tiết
            setBuyNowItem({
              ...parsedItem,
              variant: selectedVariant,
              product: response
            });
          } catch (error) {
            console.error('Error fetching product:', error);
            setError(error.message || 'Không thể tải thông tin sản phẩm');
            showError(error.message || 'Không thể tải thông tin sản phẩm');
            // Không navigate để người dùng có thể thử lại
          } finally {
            setBuyNowLoading(false);
          }
        };
        
        fetchProductDetails();
      } catch (error) {
        console.error("Error processing buyNow data:", error);
        showError('Lỗi xử lý dữ liệu sản phẩm');
        navigate('/products');
      }
    }
  }, [isBuyNow, navigate]);

  // Khởi tạo checkout và chỉ gọi fetchAddresses một lần
  useEffect(() => {
    const initCheckout = async () => {
      if (authLoading || cartLoading) return;
      
      // Kiểm tra xem người dùng đã đăng nhập chưa
      if (!isAuthenticated) {
        navigate('/login?redirect=checkout');
        return;
      }

      // Kiểm tra nếu là checkout từ BuyNow
      if (searchParams.get('from') === 'buynow') {
        setBuyNowLoading(true);
        
        try {
          // Lấy dữ liệu sản phẩm từ localStorage
          const storedItem = localStorage.getItem('buyNowItem');
          
          if (!storedItem) {
            setError('Không tìm thấy thông tin mua hàng');
            setBuyNowLoading(false);
            return;
          }
          
          const parsedItem = JSON.parse(storedItem);
          
          // Kiểm tra thời gian timeout (30 phút)
          const currentTime = Date.now();
          if (parsedItem.timestamp && currentTime - parsedItem.timestamp > BUY_NOW_TIMEOUT) {
            localStorage.removeItem('buyNowItem');
            setError('Thông tin mua hàng đã hết hạn (30 phút). Vui lòng chọn lại sản phẩm.');
            setBuyNowLoading(false);
            return;
          }
          
          // Validate dữ liệu buyNow
          if (!parsedItem.productId || !parsedItem.variantId || !parsedItem.quantity) {
            localStorage.removeItem('buyNowItem');
            setError('Thông tin sản phẩm không hợp lệ');
            setBuyNowLoading(false);
            return;
          }
          
          // Cập nhật state với dữ liệu từ localStorage
          setBuyNowItem(parsedItem);
          
          // Nếu không có đủ thông tin sản phẩm, gọi API để lấy thêm chi tiết
          if (!parsedItem.productInfo) {
            await fetchProductDetails(parsedItem.productId, parsedItem.variantId, parsedItem.quantity);
          }
          
          // Nếu địa chỉ đã được tải, kiểm tra và chọn địa chỉ được chỉ định nếu có
          if (userAddresses.length > 0 && parsedItem.addressId) {
            const selectedAddr = userAddresses.find(addr => addr.id === parsedItem.addressId);
            if (selectedAddr) {
              setSelectedAddress(selectedAddr);
            }
          }
          
        } catch (error) {
          console.error('Error processing buy now item:', error);
          setError('Có lỗi xảy ra khi xử lý thông tin mua hàng');
        } finally {
          setBuyNowLoading(false);
        }
      } else {
        // Trường hợp checkout từ Cart
        if (cartLoading) return;
        
        // Kiểm tra xem có sản phẩm nào được chọn để thanh toán không
      if (!selectedItems || selectedItems.length === 0) {
        navigate('/cart');
        return;
      }
    }

      // Tải danh sách địa chỉ nếu chưa tải
      if (!addressesLoaded && !addressesLoading && userAddresses.length === 0) {
        try {
          await dispatch(fetchAddresses()).unwrap();
          setAddressesLoaded(true);
        } catch (error) {
          console.error("Error fetching addresses:", error);
          setError('Không thể tải địa chỉ giao hàng');
        }
      }
    };
    
    initCheckout();
  }, [
    authLoading, 
    isAuthenticated, 
    isBuyNow, 
    cartLoading, 
    selectedItems, 
    navigate, 
    dispatch, 
    token, 
    addressesLoaded, 
    userAddresses,
    addressesLoading,
    BUY_NOW_TIMEOUT,
    searchParams
  ]);

  // Set default address if available - chỉ chạy khi userAddresses thay đổi
  useEffect(() => {
    if (userAddresses?.length > 0 && !selectedAddress) {
      // Nếu có địa chỉ từ mua ngay, ưu tiên chọn địa chỉ đó
      if (isBuyNow && buyNowItem?.addressId) {
        const buyNowAddress = userAddresses.find(addr => addr.id === buyNowItem.addressId);
        if (buyNowAddress) {
          setSelectedAddress(buyNowAddress);
          return;
        }
      }
      
      // Nếu không, chọn địa chỉ mặc định hoặc địa chỉ đầu tiên
      const defaultAddress =
        userAddresses.find((addr) => addr.isDefault) || userAddresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [userAddresses, userAddresses.length, isBuyNow, buyNowItem, selectedAddress]);

  const handleCreateOrder = async () => {
    console.log("handleCreateOrder called");
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng.');
      return;
    }

    // Kiểm tra giỏ hàng hoặc sản phẩm mua ngay
    if (!isBuyNow && (!selectedItems || selectedItems.length === 0)) {
      toast.error('Giỏ hàng của bạn đang trống hoặc chưa chọn sản phẩm nào.');
      return;
    }
    if (isBuyNow && !buyNowItem) {
      toast.error('Không có thông tin sản phẩm để mua ngay.');
      return;
    }

    setIsProcessing(true);
    toast.loading('Đang xử lý đơn hàng...');

    try {
      // BƯỚC 1: CHUẨN BỊ DỮ LIỆU ĐƠN HÀNG
      let orderData;
      
      if (isBuyNow && buyNowItem) {
        orderData = {
          ProductVariantId: buyNowItem.variantId,
          quantity: buyNowItem.quantity,
          addressId: selectedAddress.id,
          paymentMethod: paymentMethod
        };
      } else {
        orderData = {
          addressId: selectedAddress.id,
          paymentMethod: paymentMethod
        };
      }
      
      console.log("Order data being sent to API:", orderData);

      // BƯỚC 2: TẠO ĐƠN HÀNG TRÊN BACKEND
      let orderResponse;
      if (isBuyNow) {
        console.log('Calling buyNow API with:', orderData);
        orderResponse = await buyNow(orderData, token);
      } else {
        console.log('Calling createOrder API with:', orderData);
        orderResponse = await createOrder(orderData, token);
      }

      console.log('Order creation response:', orderResponse);

      if (!orderResponse || !orderResponse.order || !orderResponse.order.id) {
        throw new Error('Không thể tạo đơn hàng từ phản hồi của API.');
      }
      
      const orderId = orderResponse.order.id;
      localStorage.setItem('latestOrderId', orderId);

      // BƯỚC 3: XỬ LÝ THANH TOÁN
      toast.dismiss();

      if (paymentMethod === 'vnpay') {
        // Xử lý thanh toán VNPay
        const totalAmount = orderResponse.order.total + orderResponse.order.shippingFee;
        const paymentData = {
          orderId: orderId,
          amount: totalAmount,
          orderDescription: `Thanh toan don hang ${orderId}`
        };
        
        const vnpayResponse = await createVNPayPayment(paymentData);
        if (vnpayResponse.success && vnpayResponse.url) {
          window.location.href = vnpayResponse.url;
          return;
        } else {
          throw new Error('Không thể tạo thanh toán VNPay');
        }
      } else if (paymentMethod === 'momo') {
        // Xử lý thanh toán MoMo
        const totalAmount = orderResponse.order.total + orderResponse.order.shippingFee;
        const paymentData = {
          orderId: orderId,
          amount: totalAmount,
          orderDescription: `Thanh toan don hang ${orderId}`,
          paymentMethod: 'momo'
        };
        
        const momoResponse = await createMomoPayment(paymentData);
        if (momoResponse.status === 'success' && momoResponse.approvalUrl) {
          window.location.href = momoResponse.approvalUrl;
          return;
        } else {
          throw new Error('Không thể tạo thanh toán MoMo');
        }
      } else {
        // Xử lý thanh toán COD
        console.log('Processing COD payment for order:', orderId);
        const codResponse = await createCodPayment({ orderId }, token);
        console.log('COD payment response:', codResponse);

        if (codResponse && codResponse.message) {
          showSuccess(codResponse.message || 'Đơn hàng COD đã được tạo thành công!');
        } else {
          showSuccess('Đơn hàng COD đã được tạo thành công!');
        }
        
        // Dọn dẹp localStorage cho buyNow
        if (isBuyNow) {
          localStorage.removeItem('buyNowItem');
        }

        navigate(`/order-confirmation/${orderId}?payment_method=cod`);
      }

    } catch (err) {
      toast.dismiss();
      console.error('Lỗi khi tạo đơn hàng hoặc thanh toán:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra trong quá trình đặt hàng.';
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
  };

  const handleAddressAdded = () => {
    setShowAddressForm(false);
    // Không gọi fetchAddresses ở đây nữa vì sẽ tự động cập nhật qua useSelector
    showSuccess('Địa chỉ mới đã được thêm thành công');
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleVNPayPayment = async () => {
    try {
      if (!selectedAddress) {
        toast.error('Vui lòng chọn địa chỉ giao hàng');
        return;
      }

      // Tạo đơn hàng trước
      const orderData = {
        addressId: selectedAddress.id,
        paymentMethod: 'vnpay'
      };

      let orderResponse;
      if (isBuyNow) {
        orderResponse = await buyNow(orderData, token);
      } else {
        orderResponse = await createOrder(orderData, token);
      }

      if (!orderResponse || !orderResponse.order || !orderResponse.order.id) {
        throw new Error('Không thể tạo đơn hàng');
      }

      const orderId = orderResponse.order.id;
      const totalAmount = orderResponse.order.total + orderResponse.order.shippingFee;

      // Tạo thanh toán VNPay
      const paymentData = {
        orderId: orderId,
        amount: totalAmount,
        orderDescription: `Thanh toan don hang ${orderId}`
      };
      
      const response = await createVNPayPayment(paymentData);
      if (response.success && response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('Không thể tạo thanh toán VNPay');
      }
    } catch (error) {
      console.error('Error initiating VNPay payment:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo thanh toán VNPay');
    }
  };

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <Button variant="primary" onClick={handleRefresh}>
              Làm mới trang
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Hiển thị màn hình loading với nút làm mới nếu quá lâu
  if (authLoading || cartLoading || addressesLoading || (isBuyNow && buyNowLoading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <Loader />
        <p className="mt-4 text-gray-600">Đang tải thông tin thanh toán...</p>
        {timeoutLoading && (
          <div className="mt-4">
            <p className="text-red-500 mb-4">Tải dữ liệu quá lâu</p>
            <Button variant="primary" onClick={handleRefresh}>
              Làm mới trang
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Tính toán tổng tiền và hiển thị sản phẩm
  let items = [];
  let total = 0;
  let shippingFee = 0;
  
  if (isBuyNow && buyNowItem) {
    // Trường hợp mua ngay
    if (buyNowItem.productInfo) {
      // Sử dụng thông tin sản phẩm từ localStorage
      const { productInfo, quantity } = buyNowItem;
      const price = productInfo.price || 0;
      total = price * quantity;
      items = [{
        id: 'buy-now-item',
        product: {
          id: buyNowItem.productId,
          name: productInfo.name,
          price: price,
          image: productInfo.image
        },
        ProductVariant: {
          id: buyNowItem.variantId,
          ...productInfo.variantInfo
        },
        quantity: quantity,
        selected: true
      }];
    } else if (buyNowItem.product && buyNowItem.variant) {
      // Sử dụng thông tin sản phẩm từ API (cách cũ)
      const { product, variant, quantity } = buyNowItem;
      const price = variant?.price || product?.price || 0;
      total = price * quantity;
      items = [{
        id: 'buy-now-item',
        product: {
          id: product.id,
          name: product.name,
          price: price,
          image: product.ProductImages?.[0]?.url
        },
        ProductVariant: variant,
        quantity: quantity,
        selected: true
      }];
    }
    
    // Tính phí vận chuyển (ví dụ: miễn phí nếu > 1M)
    shippingFee = total >= 1000000 ? 0 : 30000;
  } else {
    // Trường hợp thanh toán từ giỏ hàng
    if (cart && selectedItems) {
      items = selectedItems;
      total = selectedItems.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * (item.quantity || 0);
      }, 0);
      shippingFee = total >= 1000000 ? 0 : 30000;
    }
  }

  // Kiểm tra nếu không có sản phẩm nào
  if (!items || items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không có sản phẩm để thanh toán</h2>
          <p className="text-gray-600 mb-6">Vui lòng thêm sản phẩm vào giỏ hàng và thử lại.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }
  
  // Hàm hiển thị danh sách địa chỉ
  const renderAddresses = () => {
    if (addressesLoading) {
      return <div className="flex justify-center"><Loader size="small" /></div>;
    }
    
    if (!userAddresses || userAddresses.length === 0) {
      return (
        <div className="text-center my-4">
          <p className="text-red-500 mb-3">Bạn chưa có địa chỉ giao hàng</p>
          <Button
            variant="primary"
            onClick={() => navigate('/addresses?redirect=checkout')}
          >
            Thêm địa chỉ mới
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {userAddresses.map((address) => {
          // Phân tích các trường dữ liệu địa chỉ - để hỗ trợ cả hai loại cấu trúc
          const name = address.fullName || address.receiverName || 'Không có tên';
          const phone = address.phone || address.phoneNumber || 'Không có SĐT';
          
          // Địa chỉ đầy đủ - kiểm tra cả hai bộ trường dữ liệu
          let addressLine = '';
          if (address.addressLine) {
            // Cấu trúc cũ
            addressLine = `${address.addressLine || ''}, ${address.city || ''}, ${address.state || ''}, ${address.country || ''}`;
          } else {
            // Cấu trúc mới
            addressLine = `${address.street || ''}, ${address.ward || ''}, ${address.district || ''}, ${address.province || ''}`;
          }
          
          // Kiểm tra xem địa chỉ có khớp với địa chỉ được chọn trong buyNow
          const isBuyNowSelectedAddress = isBuyNow && buyNowItem?.addressId === address.id;
          
          return (
            <div 
              key={address.id} 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedAddress?.id === address.id ? 'border-primary border-2 bg-primary/5' : 'border-gray-200 hover:border-primary'
              }`}
              onClick={() => setSelectedAddress(address)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">
                    {name} 
                    {address.isDefault && <span className="text-primary text-sm ml-1">(Mặc định)</span>}
                    {isBuyNowSelectedAddress && <span className="text-green-600 text-sm ml-1">(Được chọn từ trang sản phẩm)</span>}
                  </p>
                  <p className="text-sm text-gray-600">{phone}</p>
                  <p className="text-sm text-gray-600">
                    {addressLine}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="mt-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/addresses?redirect=checkout')}
          >
            + Thêm địa chỉ mới
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      {error && !buyNowLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-red-500">{error}</p>
          <Button variant="primary" className="mt-2" onClick={() => navigate('/cart')}>
            Quay lại giỏ hàng
          </Button>
        </div>
      )}
      
      {(buyNowLoading || !token) ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader />
          <p className="mt-4 text-gray-600">Đang tải thông tin thanh toán...</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin sản phẩm và địa chỉ */}
        <div className="lg:col-span-2 space-y-8">
            {/* Sản phẩm */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sản phẩm đặt mua
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b">
                    <div className="w-16 h-16 flex-shrink-0">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.ProductVariant?.size && `Size: ${item.ProductVariant.size}`}
                        {item.ProductVariant?.color && ` | Màu: ${item.ProductVariant.color}`}
                      </p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">{item.quantity} x {item.product.price.toLocaleString('vi-VN')}đ</span>
                        <span className="font-medium">{(item.quantity * item.product.price).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          {/* Địa chỉ giao hàng */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Địa chỉ giao hàng
            </h2>
            {showAddressForm ? (
              <AddressForm
                onSuccess={handleAddressAdded}
                onCancel={() => setShowAddressForm(false)}
              />
            ) : (
              <>
                  {!selectedAddress && userAddresses?.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg mb-4">
                      <p className="text-amber-700">Vui lòng chọn một địa chỉ giao hàng từ danh sách dưới đây</p>
                    </div>
                  )}
                  {renderAddresses()}
              </>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Phương thức thanh toán
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="cod" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Thanh toán khi nhận hàng (COD)
                  </span>
                  <span className="block text-sm text-gray-500">
                    Thanh toán bằng tiền mặt khi nhận hàng
                  </span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="vnpay"
                  name="payment"
                  value="vnpay"
                  checked={paymentMethod === 'vnpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="vnpay" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Thanh toán qua VNPay
                  </span>
                  <span className="block text-sm text-gray-500">
                    Thanh toán trực tuyến qua cổng thanh toán VNPay
                  </span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="momo"
                  name="payment"
                  value="momo"
                  checked={paymentMethod === 'momo'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="momo" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    Thanh toán qua MoMo
                  </span>
                  <span className="block text-sm text-gray-500">
                    Thanh toán trực tuyến qua ví MoMo
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Số lượng sản phẩm:</span>
                  <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Tổng tiền hàng:</span>
                  <span>{total.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {shippingFee === 0
                      ? 'Miễn phí'
                      : `${shippingFee.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg text-gray-900">
                  <span>Tổng cộng:</span>
                  <span>{(total + shippingFee).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

                {!selectedAddress && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
                    <p className="text-red-600 text-sm">Vui lòng chọn địa chỉ giao hàng trước khi đặt hàng</p>
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleCreateOrder}
                  disabled={isProcessing || !selectedAddress || items.length === 0}
                >
                  {isProcessing ? (
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
                    'Đặt hàng'
                  )}
                </Button>

              <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(isBuyNow ? '/products' : '/cart')}
                >
                  Quay lại
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
