const Order = require('../models/order');
const Product = require('../models/products');
const Cart = require('../models/carts');
const User = require('../models/users');
const asyncWrapper = require('../middlewares/asyncWrapper');
const appError = require('../utils/appError');
const statusText = require('../utils/statusText');
const sendEmail = require('../utils/sendEmail');

const checkoutSingleProduct = asyncWrapper(async (req, res, next) => {
  const { productId, quantity, shippingAddress, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!productId || !quantity || !shippingAddress || !paymentMethod) {
    return next(appError.create('All fields are required', 400, statusText.FAIL));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(appError.create('Product not found', 404, statusText.FAIL));
  }

  if (product.stock < quantity) {
    return next(appError.create('Insufficient stock', 400, statusText.FAIL));
  }

  const price = product.discountPrice || product.price;
  const totalAmount = price * quantity;

  const order = new Order({
    user: userId,
    products: [{
      product: productId,
      quantity,
      price
    }],
    totalAmount,
    shippingAddress,
    paymentMethod
  });

  await order.save();

  // Deduct stock
  product.stock -= quantity;
  await product.save();

  // Add to user order history
  const user = await User.findById(userId);
  user.orderHistory.push(order._id);
  await user.save();

  // Send order confirmation email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Order Confirmation',
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <p>Order ID: ${order._id}</p>
        <p>Total Amount: $${totalAmount}</p>
        <p>Status: ${order.status}</p>
      `
    });
  } catch (error) {
    console.log('Email sending failed:', error);
  }

  res.json({
    status: statusText.SUCCESS,
    data: {
      order,
      summary: {
        totalItems: quantity,
        totalAmount,
        shippingAddress,
        paymentMethod
      }
    }
  });
});

const checkoutMultipleProducts = asyncWrapper(async (req, res, next) => {
  const { shippingAddress, paymentMethod, fromCart } = req.body;
  const userId = req.user.id;

  if (!shippingAddress || !paymentMethod) {
    return next(appError.create('Shipping address and payment method are required', 400, statusText.FAIL));
  }

  let products = [];
  let totalAmount = 0;
  let totalItems = 0;

  if (fromCart) {
    // Checkout from cart
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    if (!cart || cart.products.length === 0) {
      return next(appError.create('Cart is empty', 400, statusText.FAIL));
    }

    for (const item of cart.products) {
      const product = item.product;
      if (product.stock < item.quantity) {
        return next(appError.create(`Insufficient stock for ${product.name}`, 400, statusText.FAIL));
      }

      const price = product.discountPrice || product.price;
      products.push({
        product: product._id,
        quantity: item.quantity,
        price
      });
      totalAmount += price * item.quantity;
      totalItems += item.quantity;

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Clear cart
    cart.products = [];
    await cart.save();
  } else {
    // Checkout specific products
    const { products: productList } = req.body;
    if (!productList || !Array.isArray(productList)) {
      return next(appError.create('Products array is required', 400, statusText.FAIL));
    }

    for (const item of productList) {
      const { productId, quantity } = item;
      const product = await Product.findById(productId);
      if (!product) {
        return next(appError.create('Product not found', 404, statusText.FAIL));
      }

      if (product.stock < quantity) {
        return next(appError.create(`Insufficient stock for ${product.name}`, 400, statusText.FAIL));
      }

      const price = product.discountPrice || product.price;
      products.push({
        product: productId,
        quantity,
        price
      });
      totalAmount += price * quantity;
      totalItems += quantity;

      // Deduct stock
      product.stock -= quantity;
      await product.save();
    }
  }

  const order = new Order({
    user: userId,
    products,
    totalAmount,
    shippingAddress,
    paymentMethod
  });

  await order.save();

  // Add to user order history
  const user = await User.findById(userId);
  user.orderHistory.push(order._id);
  await user.save();

  // Send order confirmation email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Order Confirmation',
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <p>Order ID: ${order._id}</p>
        <p>Total Amount: $${totalAmount}</p>
        <p>Status: ${order.status}</p>
      `
    });
  } catch (error) {
    console.log('Email sending failed:', error);
  }

  res.json({
    status: statusText.SUCCESS,
    data: {
      order,
      summary: {
        totalItems,
        totalAmount,
        shippingAddress,
        paymentMethod
      }
    }
  });
});
module.exports = {checkoutSingleProduct , checkoutMultipleProducts}