const Order = require('../models/order');
const User = require('../models/users');
const asyncWrapper = require('../middlewares/asyncWrapper');
const appError = require('../utils/appError');
const statusText = require('../utils/statusText');
const sendEmail = require('../utils/sendEmail');

// Get all orders for the authenticated user
const getUserOrders = asyncWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const orders = await Order.find({ user: userId })
    .populate('products.product', 'name images price discountPrice')
    .sort({ createdAt: -1 });

  res.json({
    status: statusText.SUCCESS,
    data: { orders }
  });
});

// Get specific order by ID (only if belongs to user or admin)
const getOrderById = asyncWrapper(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const order = await Order.findById(orderId)
    .populate('products.product')
    .populate('user');

  if (!order) {
    return next(appError.create('Order not found', 404, statusText.FAIL));
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== userId && userRole !== 'admin') {
    return next(appError.create('Access denied', 403, statusText.FAIL));
  }

  res.json({
    status: statusText.SUCCESS,
    data: { order }
  });
});

// Update order status (admin only)
const updateOrderStatus = asyncWrapper(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(appError.create('Invalid status', 400, statusText.FAIL));
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return next(appError.create('Order not found', 404, statusText.FAIL));
  }

  order.status = status;
  order.updatedAt = Date.now();
  await order.save();

  // Send email notification about status update
  const user = await User.findById(order.user);
  try {
    await sendEmail({
      email: user.email,
      subject: 'Order Status Update',
      html: `
        <h1>Order Status Update</h1>
        <p>Your order status has been updated.</p>
        <p>Order ID: ${order._id}</p>
        <p>New Status: ${status}</p>
      `
    });
  } catch (error) {
    console.log('Email sending failed:', error);
  }

  res.json({
    status: statusText.SUCCESS,
    data: { order }
  });
});

// Cancel order (user can cancel if pending)
const cancelOrder = asyncWrapper(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(appError.create('Order not found', 404, statusText.FAIL));
  }

  if (order.user.toString() !== userId) {
    return next(appError.create('Access denied', 403, statusText.FAIL));
  }

  if (order.status !== 'pending') {
    return next(appError.create('Order cannot be cancelled', 400, statusText.FAIL));
  }

  order.status = 'cancelled';
  order.updatedAt = Date.now();
  await order.save();

  // Send email notification about cancellation
  const user = await User.findById(userId);
  try {
    await sendEmail({
      email: user.email,
      subject: 'Order Cancellation',
      html: `
        <h1>Order Cancellation</h1>
        <p>Your order has been cancelled.</p>
        <p>Order ID: ${order._id}</p>
      `
    });
  } catch (error) {
    console.log('Email sending failed:', error);
  }

  res.json({
    status: statusText.SUCCESS,
    data: { order }
  });
});

// Get all orders (admin only)
const getAllOrders = asyncWrapper(async (req, res, next) => {
  const orders = await Order.find()
    .populate('products.product', 'name images price discountPrice')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    status: statusText.SUCCESS,
    data: { orders }
  });
});

module.exports = {
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
};