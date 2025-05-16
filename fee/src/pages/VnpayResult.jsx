import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import api from '../services/api';
import { useSearchParams } from 'react-router-dom';
import { getOrderById } from '../services/order';
import styles from '../styles/VnpayResult.module.css';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import { BiError } from 'react-icons/bi';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/Loader';

// Mã lỗi VNPAY trả về
const VNPAY_ERROR_CODES = {
  '00': 'Giao dịch thành công',
  '01': 'Giao dịch đã tồn tại',
  '02': 'Merchant không hợp lệ',
  '03': 'Dữ liệu gửi sang không đúng định dạng',
  '04': 'Khởi tạo GD không thành công do Website đang bị tạm khóa',
  '05': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu quá số lần quy định',
  '06': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
  '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ',
  '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
  '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
  '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu',
  '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
  '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
  '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Lỗi không xác định',
};

const VnpayResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [additionalErrors, setAdditionalErrors] = useState({});
  
  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        setLoading(true);
        
        // Extract parameters from URL
        const txnRef = searchParams.get('vnp_TxnRef');
        const responseCode = searchParams.get('vnp_ResponseCode');
        const transactionId = searchParams.get('vnp_TransactionNo');
        const bankCode = searchParams.get('vnp_BankCode');
        const payDate = searchParams.get('vnp_PayDate');
        const amount = searchParams.get('vnp_Amount');
        const errorCode = searchParams.get('error_code');
        const errorMessage = searchParams.get('error_message');
        
        // Extract additional error parameters
        const orderNotFound = searchParams.get('order_not_found') === 'true';
        const invalidSignature = searchParams.get('invalid_signature') === 'true';
        const missingTxnRef = searchParams.get('missing_txn_ref') === 'true';
        const serverError = searchParams.get('server_error') === 'true';
        
        // Set additional errors object
        const errors = {};
        if (orderNotFound) errors.orderNotFound = true;
        if (invalidSignature) errors.invalidSignature = true;
        if (missingTxnRef) errors.missingTxnRef = true;
        if (serverError) errors.serverError = true;
        if (errorCode) errors.errorCode = errorCode;
        if (errorMessage) errors.errorMessage = errorMessage;
        
        setAdditionalErrors(errors);
        
        // Check if there's a transaction reference
        if (!txnRef && !missingTxnRef && !serverError) {
          setError('No transaction reference found.');
          setLoading(false);
          return;
        }
        
        // Set payment result based on response code or additional errors
        if (missingTxnRef) {
          setPaymentResult({
            success: false,
            message: 'Missing transaction reference'
          });
          setLoading(false);
          return;
        }
        
        if (serverError) {
          setPaymentResult({
            success: false,
            message: errorMessage || 'Server error occurred while processing payment'
          });
          setLoading(false);
          return;
        }
        
        if (invalidSignature) {
          setPaymentResult({
            success: false,
            message: 'Payment validation failed: Invalid security signature'
          });
          setLoading(false);
          return;
        }
        
        if (orderNotFound) {
          setPaymentResult({
            success: false,
            message: 'The order associated with this payment could not be found'
          });
          setLoading(false);
          return;
        }
        
        // Set payment result based on VNPay response code
        setPaymentResult({
          success: responseCode === '00',
          message: responseCode === '00' 
            ? 'Payment successful' 
            : VNPAY_ERROR_CODES[responseCode] || errorMessage || 'Payment failed',
          transactionId,
          bankCode,
          payDate,
          amount: amount ? parseInt(amount) / 100 : null
        });
        
        // Only attempt to fetch order if there's a transaction reference and order is not already known to be missing
        if (txnRef && !orderNotFound) {
          // Extract orderId from txnRef (if formatted as orderId_timestamp)
          let orderId;
          if (txnRef.includes('_')) {
            orderId = txnRef.split('_')[0];
          } else if (txnRef.includes('-')) {
            orderId = txnRef.split('-')[0];
          } else {
            orderId = txnRef;
          }
          
          try {
            const response = await getOrderById(orderId);
            if (response.data) {
              setOrder(response.data);
              
              // Verify payment status matches response code
              if (response.data.paymentStatus === 'PAID' && responseCode !== '00') {
                console.warn('Order marked as PAID but VNPay response indicated failure');
              } else if (response.data.paymentStatus !== 'PAID' && responseCode === '00') {
                console.warn('VNPay indicated success but order not marked as PAID');
              }
            }
          } catch (orderError) {
            console.error('Error fetching order:', orderError);
            errors.orderFetchFailed = true;
            setAdditionalErrors(errors);
          }
        }
      } catch (err) {
        console.error('Error processing payment result:', err);
        setError('Failed to process payment result.');
        toast.error('An error occurred while processing payment result.');
      } finally {
        setLoading(false);
      }
    };
    
    processPaymentResult();
    
    // Auto-navigate to orders page after 10 seconds for successful payments
    const timer = setTimeout(() => {
      const responseCode = searchParams.get('vnp_ResponseCode');
      if (responseCode === '00') {
        if (user) {
          navigate('/orders');
        } else {
          navigate('/');
        }
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [searchParams, navigate, user]);
  
  if (loading) {
    return <div className={styles.container}>
      <LoadingSpinner />
      <p className={styles.loadingText}>Processing payment result...</p>
    </div>;
  }
  
  if (error) {
    return <div className={styles.container}>
      <div className={styles.errorContainer}>
        <BiError className={styles.errorIcon} />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          className={styles.button} 
          onClick={() => navigate('/')}
        >
          Return to Homepage
        </button>
      </div>
    </div>;
  }
  
  return (
    <div className={styles.container}>
      {paymentResult && (
        <div className={paymentResult.success ? styles.successContainer : styles.errorContainer}>
          {paymentResult.success ? (
            <BsCheckCircleFill className={styles.successIcon} />
          ) : (
            <BsXCircleFill className={styles.errorIcon} />
          )}
          
          <h2>{paymentResult.success ? 'Payment Successful' : 'Payment Failed'}</h2>
          <p>{paymentResult.message}</p>
          
          {additionalErrors.missingTxnRef && (
            <p className={styles.errorDetail}>Transaction reference not found in the payment response.</p>
          )}
          
          {additionalErrors.invalidSignature && (
            <p className={styles.errorDetail}>Payment validation failed: Invalid security signature.</p>
          )}
          
          {additionalErrors.orderNotFound && (
            <p className={styles.errorDetail}>The order associated with this payment could not be found.</p>
          )}
          
          {additionalErrors.serverError && (
            <p className={styles.errorDetail}>A server error occurred during payment processing.</p>
          )}
          
          {additionalErrors.errorCode && !additionalErrors.serverError && (
            <p className={styles.errorDetail}>Error code: {additionalErrors.errorCode}</p>
          )}
          
          {additionalErrors.errorMessage && !additionalErrors.serverError && (
            <p className={styles.errorDetail}>{additionalErrors.errorMessage}</p>
          )}
          
          {additionalErrors.orderFetchFailed && (
            <p className={styles.errorDetail}>Could not retrieve order details. The payment may still have been processed.</p>
          )}
          
          {order && (
            <div className={styles.orderDetails}>
              <h3>Order Details</h3>
              <div className={styles.orderInfo}>
                <p><strong>Order ID:</strong> {order.id || order._id}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Amount:</strong> {order.totalAmount?.toLocaleString()} VND</p>
                <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
                <p><strong>Order Status:</strong> {order.status}</p>
              </div>
            </div>
          )}
          
          {paymentResult.transactionId && (
            <div className={styles.transactionDetails}>
              <h3>Transaction Details</h3>
              <div className={styles.transactionInfo}>
                <p><strong>Transaction ID:</strong> {paymentResult.transactionId}</p>
                {paymentResult.bankCode && <p><strong>Bank:</strong> {paymentResult.bankCode}</p>}
                {paymentResult.payDate && <p><strong>Payment Date:</strong> {paymentResult.payDate}</p>}
                {paymentResult.amount && <p><strong>Amount:</strong> {paymentResult.amount.toLocaleString()} VND</p>}
              </div>
            </div>
          )}
          
          <div className={styles.buttonGroup}>
            <button 
              className={styles.button} 
              onClick={() => navigate('/')}
            >
              Return to Homepage
            </button>
            {user && (
              <button 
                className={styles.button} 
                onClick={() => navigate('/orders')}
              >
                View Your Orders
              </button>
            )}
          </div>
          
          {paymentResult.success && (
            <p className={styles.redirectMessage}>
              You will be redirected to your orders page in a few seconds...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VnpayResult; 