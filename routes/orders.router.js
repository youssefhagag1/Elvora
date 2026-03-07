const express = require('express');
const router = express.Router();
const {
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
} = require('../controllers/orders.controller');
const verifyToken = require('../middlewares/verifyToken');
const allowTo = require('../middlewares/allowTo');

// Get user's orders
router.get('/my-orders', verifyToken, getUserOrders);

// Get specific order by ID
router.get('/:orderId', verifyToken, getOrderById);

// Cancel order (user only, if pending)
router.patch('/:orderId/cancel', verifyToken , allowTo("user"), cancelOrder);

// Update order status (admin only)
router.patch('/:orderId/status', verifyToken, allowTo('admin'), updateOrderStatus);

// Get all orders (admin only)
router.get('/', verifyToken, allowTo('admin'), getAllOrders);

module.exports = router;