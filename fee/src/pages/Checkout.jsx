import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useCart from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { createOrder, createPayment, buyNow } from '../services/order';
import { createCodPayment, createVnpayPayment, createPaypalPayment } from '../services/payment';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Button from '../components/common/Button';
import AddressForm from '../components/address/AddressForm';
import AddressList from '../components/address/AddressList';
import useTitle from '../hooks/useTitle';
import { fetchAddresses } from '../redux/slices/addressSlice';
import CartSummary from '../components/cart/CartSummary';
import { showSuccess, showError } from '../utils/notification';
import useApi from '../hooks/useApi';
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
  const [paypalReady, setPaypalReady] = useState(false);

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
    
    // Debug địa chỉ
    if (userAddresses && userAddresses.length > 0) {
      console.log("First address structure:", userAddresses[0]);
      console.log("Selected address:", selectedAddress);
    }
  }, [cartLoading, authLoading, addressesLoading, buyNowLoading, isBuyNow, 
      selectedItems?.length, cart?.length, userAddresses?.length, selectedAddress]);

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
    userAddresses.length,
    addressesLoading
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
  }, [userAddresses, isBuyNow, buyNowItem, selectedAddress]);

  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    setIsProcessing(true);
    let orderResponse = null;
    let paymentInitiated = false;
    
    try {
      // BƯỚC 1: CHUẨN BỊ DỮ LIỆU ĐƠN HÀNG
      // Chuẩn bị dữ liệu để tạo đơn hàng
      let orderData;
      
      if (isBuyNow && buyNowItem) {
        // Đảm bảo dữ liệu cho API buy-now có đúng định dạng
        orderData = {
          ProductVariantId: buyNowItem.variantId,
          quantity: buyNowItem.quantity,
          addressId: selectedAddress.id,
          paymentMethod: 'cod'  // Luôn luôn dùng COD trước tiên
        };
      } else {
        // Dữ liệu cho createOrder từ giỏ hàng
        orderData = {
          addressId: selectedAddress.id,
          paymentMethod: 'cod'  // Luôn luôn dùng COD trước tiên
        };
      }
      
      // Hiển thị dữ liệu gửi đi để debug
      console.log('Sending order data:', JSON.stringify(orderData));
      
      // Thêm kiểm tra token
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }
      
      // BƯỚC 2: TẠO ĐƠN HÀNG
      try {
        // Gọi API để tạo đơn hàng
        const apiCallTimeStart = Date.now();
        
        if (isBuyNow) {
          console.log('Calling buyNow API...');
          orderResponse = await buyNow(orderData, token);
        } else {
          console.log('Calling createOrder API...');
          orderResponse = await createOrder(orderData, token);
        }
        
        console.log(`API call completed in ${Date.now() - apiCallTimeStart}ms`);
        console.log('Order API response:', orderResponse);
        
        if (!orderResponse) {
          throw new Error('Server không phản hồi khi tạo đơn hàng');
        }
        
        // Kiểm tra cấu trúc phản hồi - ID đơn hàng nằm trong trường 'order'
        if (!orderResponse.order || !orderResponse.order.id) {
          console.error('Missing order ID in response:', orderResponse);
          throw new Error('Phản hồi từ server không hợp lệ: thiếu ID đơn hàng');
        }
        
        // Lấy ID thực tế của đơn hàng
        const orderId = orderResponse.order.id;
      } catch (orderApiError) {
        console.error('API Error Details:', orderApiError);
        
        // Kiểm tra lỗi từ response
        if (orderApiError.response) {
          console.error('API Response Error:', orderApiError.response.data);
          
          // Nếu lỗi từ server có message cụ thể
          if (orderApiError.response.data && orderApiError.response.data.message) {
            throw new Error(`Lỗi từ server: ${orderApiError.response.data.message}`);
          }
          
          // Kiểm tra status code
          if (orderApiError.response.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          } else if (orderApiError.response.status === 400) {
            throw new Error('Dữ liệu đơn hàng không hợp lệ. Vui lòng kiểm tra lại.');
          } else if (orderApiError.response.status === 500) {
            throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
          }
        }
        
        // Lỗi mạng
        if (orderApiError.message && orderApiError.message.includes('Network Error')) {
          throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
        }
        
        // Nếu không nhận diện được lỗi cụ thể
        throw orderApiError;
      }
      
      console.log('Order created successfully:', orderResponse);
      
      // BƯỚC 3: XỬ LÝ THANH TOÁN DỰA TRÊN PHƯƠNG THỨC
      switch (paymentMethod) {
        case 'cod':
          // Thanh toán COD - đơn giản nhất
          try {
            await createCodPayment({ orderId: orderResponse.order.id });
            paymentInitiated = true;
            
            // Xóa thông tin mua ngay sau khi thanh toán thành công
            if (isBuyNow) localStorage.removeItem('buyNowItem');
            
      toast.success('Đơn hàng đã được tạo thành công!');
            setTimeout(() => {
              navigate(`/order-confirmation/${orderResponse.order.id}`);
            }, 1000);
          } catch (codError) {
            console.error('COD payment error:', codError);
            throw new Error('Không thể hoàn tất thanh toán COD');
          }
          break;
          
        case 'vnpay':
          try {
            // Format số tiền đúng định dạng VNPay yêu cầu (số nguyên)
            const totalAmount = Math.round(total + shippingFee);
            
            console.log('Creating VNPay payment for order:', orderResponse.order.id, 'with amount:', totalAmount);
            
            // Đảm bảo mã paymentMethod đúng định dạng server mong đợi
            const paymentData = {
              orderId: orderResponse.order.id,
              amount: totalAmount,
              ipAddr: window.location.hostname || '127.0.0.1',
              orderInfo: `Thanh toán đơn hàng #${orderResponse.order.id}`,
              returnUrl: `${window.location.origin}/payment-result`
            };
            
            console.log('VNPay payment request data:', JSON.stringify(paymentData));
            
            // Gọi API tạo thanh toán VNPay với timeout
            const vnpayPromise = createVnpayPayment(paymentData);
            
            // Thêm timeout cho API call
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout khi tạo thanh toán VNPay')), 15000)
            );
            
            // Race giữa API call và timeout
            const vnpayResponse = await Promise.race([vnpayPromise, timeoutPromise]);
            
            console.log('VNPay payment response:', vnpayResponse);
            
            if (!vnpayResponse) {
              throw new Error('Không nhận được phản hồi từ cổng thanh toán VNPay');
            }
            
            if (!vnpayResponse.paymentUrl) {
              throw new Error('Không nhận được URL thanh toán từ VNPay');
            }
            
            // Đánh dấu đã khởi tạo thanh toán
            paymentInitiated = true;
            
            // Xóa thông tin mua ngay nếu là mua ngay
            if (isBuyNow) localStorage.removeItem('buyNowItem');
            
            // Đảm bảo URL thanh toán hợp lệ
            let paymentUrl = vnpayResponse.paymentUrl;
            if (!paymentUrl.startsWith('http')) {
              paymentUrl = `https://${paymentUrl}`;
            }
            
            console.log('Redirecting to VNPay URL:', paymentUrl);
            
            // Chuyển hướng đến trang thanh toán VNPay sau một khoảng thời gian ngắn
            toast.success('Đơn hàng đã được tạo! Đang chuyển hướng đến cổng thanh toán VNPay...');
            
            // Lưu URL thanh toán vào localStorage để có thể truy cập sau này nếu cần
            localStorage.setItem('vnpayPaymentUrl', paymentUrl);
            
            // Tạo iframe để xử lý thanh toán trong trang hiện tại
            try {
              // Đầu tiên thử mở trong iframe
              const iframe = document.createElement('iframe');
              iframe.id = 'vnpay-iframe';
              iframe.style.width = '100%';
              iframe.style.height = '650px';
              iframe.style.border = 'none';
              iframe.style.position = 'fixed';
              iframe.style.top = '0';
              iframe.style.left = '0';
              iframe.style.zIndex = '9999';
              iframe.style.backgroundColor = '#fff';
              iframe.setAttribute('allowfullscreen', 'true');
              iframe.src = paymentUrl;
              
              // Thêm nút đóng
              const closeButton = document.createElement('button');
              closeButton.textContent = 'Đóng';
              closeButton.style.position = 'fixed';
              closeButton.style.top = '10px';
              closeButton.style.right = '10px';
              closeButton.style.zIndex = '10000';
              closeButton.style.padding = '8px 16px';
              closeButton.style.backgroundColor = '#d32f2f';
              closeButton.style.color = 'white';
              closeButton.style.border = 'none';
              closeButton.style.borderRadius = '4px';
              closeButton.style.cursor = 'pointer';
              closeButton.onclick = function() {
                document.body.removeChild(iframe);
                document.body.removeChild(closeButton);
                navigate(`/order-confirmation/${orderResponse.order.id}?payment=pending`);
              };
              
              document.body.appendChild(iframe);
              document.body.appendChild(closeButton);
              
              // Kiểm tra nếu iframe không tải được hoặc bị chặn
              setTimeout(() => {
                try {
                  // Kiểm tra nếu iframe đã được truy cập
                  if (iframe.contentWindow.location.href) {
                    console.log('Iframe loaded successfully');
                  }
                } catch (e) {
                  // Nếu không thể truy cập iframe (do CORS hoặc bị chặn)
                  console.error('Iframe access error, falling back to window.location:', e);
                  document.body.removeChild(iframe);
                  document.body.removeChild(closeButton);
                  window.location.href = paymentUrl;
                }
              }, 3000);
            } catch (iframeError) {
              console.error('Error creating VNPay iframe, falling back to direct redirect:', iframeError);
              window.location.href = paymentUrl;
            }
          } catch (vnpayError) {
            console.error('VNPay payment error:', vnpayError);
            throw new Error(`Lỗi khởi tạo thanh toán VNPay: ${vnpayError.message}`);
          }
          break;
          
        case 'paypal':
          try {
            console.log('Creating PayPal payment for order:', orderResponse.order.id);
            
            // Lưu orderId vào localStorage để sử dụng sau khi thanh toán PayPal hoàn tất
            localStorage.setItem('paypalOrderId', orderResponse.order.id);
            
            // Gọi API tạo thanh toán PayPal
            const paypalResponse = await createPaypalPayment({
              orderId: orderResponse.order.id,
              returnUrl: `${window.location.origin}/paypal-success`,
              cancelUrl: `${window.location.origin}/paypal-cancel`
            });
            
            console.log('PayPal payment response:', paypalResponse);
            
            if (!paypalResponse || !paypalResponse.approvalUrl) {
              throw new Error('Không nhận được URL thanh toán từ PayPal');
            }
            
            // Đánh dấu đã khởi tạo thanh toán
            paymentInitiated = true;
            
            // Xóa thông tin mua ngay nếu là mua ngay
            if (isBuyNow) localStorage.removeItem('buyNowItem');
            
            // Chuyển hướng đến trang thanh toán PayPal
            toast.success('Đang chuyển hướng đến cổng thanh toán PayPal...');
            setTimeout(() => {
              window.location.href = paypalResponse.approvalUrl;
            }, 1000);
          } catch (paypalError) {
            console.error('PayPal payment error:', paypalError);
            throw new Error(`Lỗi khởi tạo thanh toán PayPal: ${paypalError.message}`);
          }
          break;
          
        default:
          throw new Error('Phương thức thanh toán không được hỗ trợ');
      }
    } catch (err) {
      console.error('Order process error:', err);
      
      // Hiển thị thông báo lỗi cụ thể cho người dùng
      if (err.response && err.response.data && err.response.data.message) {
        // Lỗi từ API có message cụ thể
        toast.error(`Lỗi: ${err.response.data.message}`);
      } else {
        // Lỗi thông thường
        toast.error(err.message || 'Không thể hoàn tất đơn hàng. Vui lòng thử lại.');
      }
      
      // Thông báo cho người dùng khi đơn hàng đã được tạo nhưng không thể tạo thanh toán
      if (orderResponse && orderResponse.order && !paymentInitiated) {
        toast.error('Đơn hàng đã được tạo nhưng không thể khởi tạo thanh toán. Vui lòng kiểm tra trong lịch sử đơn hàng của bạn.');
      }
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
                      VNPay
                    </span>
                    <span className="block text-sm text-gray-500">
                      Thanh toán qua cổng VNPay (ATM, thẻ tín dụng, QR Code)
                    </span>
                  </label>
                </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="paypal"
                  name="payment"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="paypal" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    PayPal
                  </span>
                  <span className="block text-sm text-gray-500">
                      Thanh toán qua PayPal hoặc thẻ tín dụng quốc tế
                  </span>
                </label>
                </div>
                
                {paymentMethod === 'paypal' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Bạn sẽ được chuyển hướng đến trang thanh toán PayPal sau khi đặt hàng
                    </p>
                  </div>
                )}
                
                {paymentMethod === 'vnpay' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay sau khi đặt hàng
                    </p>
                  </div>
                )}
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
                  onClick={() => {
                    console.log('----------------------');
                    console.log('BUTTON CLICKED - PAYMENT METHOD:', paymentMethod);
                    console.log('Selected address:', selectedAddress);
                    console.log('isBuyNow:', isBuyNow);
                    if (isBuyNow) {
                      console.log('buyNowItem:', buyNowItem);
                    } else {
                      console.log('selectedItems:', selectedItems);
                    }
                    console.log('----------------------');
                    handleCreateOrder();
                  }}
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
