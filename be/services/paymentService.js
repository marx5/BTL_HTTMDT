const { sequelize } = require('../config/database');
const { Order, Payment, PaymentLog } = require('../models');
const { 
  PAYMENT_STATUS, 
  ORDER_STATUS,
  isValidStatusTransition,
  getOrderStatusForPayment 
} = require('../constants/paymentStatus');

class PaymentService {
  /**
   * Updates payment status with validation and logging
   * @param {number} orderId - Order ID
   * @param {string} newStatus - New payment status
   * @param {Object} transactionInfo - Additional transaction information
   * @returns {Promise<Object>} Updated order and payment information
   */
  async updatePaymentStatus(orderId, newStatus, transactionInfo = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('OrderId:', orderId);
      const order = await Order.findByPk(orderId, { 
        transaction,
        include: [{
          model: Payment,
          as: 'Payment'
        }]
      });
      
      if (!order) {
        await transaction.rollback();
        console.error('Order not found:', orderId);
        throw new Error('Order not found');
      }
      console.log('Order paymentStatus:', order.paymentStatus, 'newStatus:', newStatus);

      if (!isValidStatusTransition(order.paymentStatus, newStatus)) {
        await transaction.rollback();
        console.error('Invalid status transition:', order.paymentStatus, '->', newStatus);
        throw new Error(`Invalid status transition from ${order.paymentStatus} to ${newStatus}`);
      }

      const orderStatus = getOrderStatusForPayment(newStatus);

      await order.update({
        paymentStatus: newStatus,
        status: orderStatus,
        transactionDetails: {
          ...order.transactionDetails,
          ...transactionInfo,
          statusChange: {
            from: order.paymentStatus,
            to: newStatus,
            timestamp: new Date()
          }
        }
      }, { transaction });

      await Payment.update(
        {
          status: newStatus,
          transactionDetails: transactionInfo
        },
        {
          where: { OrderId: orderId },
          transaction
        }
      );

      await transaction.commit();
      
      return {
        success: true,
        order: await Order.findByPk(orderId, {
          include: [{
            model: Payment,
            as: 'Payment'
          }]
        })
      };
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Handles payment callback from payment gateway
   * @param {Object} paymentData - Payment callback data
   * @returns {Promise<Object>} Updated order information
   */
  async handlePaymentCallback(paymentData) {
    const { orderId, status, transactionId, amount } = paymentData;

    // Validate payment amount
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (amount !== order.total) {
      throw new Error('Payment amount does not match order total');
    }

    // Map gateway status to our status
    const mappedStatus = this.mapGatewayStatus(status);

    // Update payment status
    return this.updatePaymentStatus(orderId, mappedStatus, {
      gatewayTransactionId: transactionId,
      gatewayStatus: status,
      amount,
      timestamp: new Date()
    });
  }

  /**
   * Cập nhật trạng thái thanh toán từ cổng thanh toán
   * @param {number} orderId - ID đơn hàng
   * @param {string} gatewayStatus - Trạng thái từ cổng thanh toán
   * @param {Object} transactionInfo - Thông tin giao dịch
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  async handleGatewayPaymentStatus(orderId, gatewayStatus, transactionInfo = {}) {
    try {
      const internalStatus = this.mapGatewayStatus(gatewayStatus);
      const order = await Order.findByPk(orderId, {
        include: [{
          model: Payment,
          as: 'Payment'
        }]
      });
      
      if (!order) {
        throw new Error('Order not found');
      }

      const result = await this.updatePaymentStatus(orderId, internalStatus, {
        ...transactionInfo,
        gatewayStatus,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      console.error('Error in handleGatewayPaymentStatus:', error);
      throw error;
    }
  }

  /**
   * Chuyển đổi trạng thái từ cổng thanh toán sang trạng thái nội bộ
   * @param {string} gatewayStatus - Trạng thái từ cổng thanh toán
   * @returns {string} Trạng thái nội bộ
   */
  mapGatewayStatus(gatewayStatus) {
    const statusMap = {
      'SUCCESS': PAYMENT_STATUS.PAID,
      'FAILED': PAYMENT_STATUS.FAILED,
      'CANCELLED': PAYMENT_STATUS.CANCELLED,
      'PENDING': PAYMENT_STATUS.PENDING
    };

    return statusMap[gatewayStatus] || PAYMENT_STATUS.FAILED;
  }
}

module.exports = new PaymentService(); 