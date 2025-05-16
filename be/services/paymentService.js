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
      // Get order with current payment status
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate status transition
      if (!isValidStatusTransition(order.paymentStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${order.paymentStatus} to ${newStatus}`);
      }

      // Get corresponding order status
      const orderStatus = getOrderStatusForPayment(newStatus);

      // Update order status
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

      // Create payment log
      await PaymentLog.create({
        orderId,
        fromStatus: order.paymentStatus,
        toStatus: newStatus,
        transactionInfo,
        timestamp: new Date()
      }, { transaction });

      // If payment is successful, update payment record
      if (newStatus === PAYMENT_STATUS.PAID) {
        await Payment.update(
          {
            status: PAYMENT_STATUS.PAID,
            transactionDetails: transactionInfo
          },
          {
            where: { OrderId: orderId },
            transaction
          }
        );
      }

      await transaction.commit();
      
      return {
        success: true,
        order: await Order.findByPk(orderId, {
          include: [Payment]
        })
      };
    } catch (error) {
      await transaction.rollback();
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
   * Maps payment gateway status to our internal status
   * @param {string} gatewayStatus - Status from payment gateway
   * @returns {string} Our internal payment status
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