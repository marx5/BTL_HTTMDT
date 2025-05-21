/**
 * Payment Status Constants and Validation
 */

// Payment Status Enum
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

// Order Status Enum
const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Valid status transitions
const VALID_STATUS_TRANSITIONS = {
  PENDING: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['REFUNDED'],
  FAILED: ['PENDING', 'CANCELLED', 'PAID'],
  CANCELLED: [],
  REFUNDED: []
};

// Payment status to Order status mapping
const PAYMENT_TO_ORDER_STATUS = {
  [PAYMENT_STATUS.PENDING]: ORDER_STATUS.PENDING,
  [PAYMENT_STATUS.PAID]: ORDER_STATUS.PENDING,
  [PAYMENT_STATUS.FAILED]: ORDER_STATUS.PENDING,
  [PAYMENT_STATUS.CANCELLED]: ORDER_STATUS.CANCELLED,
  [PAYMENT_STATUS.REFUNDED]: ORDER_STATUS.REFUNDED
};

// Order status to Payment status mapping
const ORDER_TO_PAYMENT_STATUS = {
  pending: 'PENDING',
  completed: 'PAID',
  cancelled: 'CANCELLED',
  refunded: 'REFUNDED'
};

/**
 * Validates if a status transition is allowed
 * @param {string} currentStatus - Current payment status
 * @param {string} newStatus - New payment status to transition to
 * @returns {boolean} - Whether the transition is valid
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

/**
 * Gets the corresponding order status for a payment status
 * @param {string} paymentStatus - Payment status
 * @returns {string} - Corresponding order status
 */
const getOrderStatusForPayment = (paymentStatus) => {
  return PAYMENT_TO_ORDER_STATUS[paymentStatus] || ORDER_STATUS.PENDING;
};

/**
 * Gets the corresponding payment status for an order status
 * @param {string} orderStatus - Order status
 * @returns {string} - Corresponding payment status
 */
const getPaymentStatusForOrder = (orderStatus) => {
  return ORDER_TO_PAYMENT_STATUS[orderStatus] || 'PENDING';
};

module.exports = {
  PAYMENT_STATUS,
  ORDER_STATUS,
  VALID_STATUS_TRANSITIONS,
  PAYMENT_TO_ORDER_STATUS,
  isValidStatusTransition,
  getOrderStatusForPayment,
  getPaymentStatusForOrder
}; 