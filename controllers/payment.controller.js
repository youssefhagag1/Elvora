const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const Product = require("../models/products");
const Order = require("../models/order");
const User = require("../models/users");
const asyncWrapper = require("../middlewares/asyncWrapper");
const appError = require("../utils/appError");
const statusText = require("../utils/statusText");


const createCheckoutSession = asyncWrapper(async (req, res, next) => {
  const { products, shippingAddress } = req.body;
  const userId = req.user.id;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return next(appError.create("Products array is required", 400, statusText.FAIL));
  }

  const line_items = [];
  let totalAmount = 0;

  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return next(appError.create(`Product not found: ${item.productId}`, 404, statusText.FAIL));
    }

    const price = product.discountPrice || product.price;

    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          images: product.images
        },
        unit_amount: price * 100
      },
      quantity: item.quantity
    });

    totalAmount += price * item.quantity;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items,
    metadata: {
      userId,
      products: JSON.stringify(products),
      shippingAddress
    },
    success_url: "http://localhost:4200/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:4200/cancel"
  });

  res.json({
    status: statusText.SUCCESS,
    data: { url: session.url }
  });
});


const confirmStripePayment = asyncWrapper(async (req, res, next) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return next(appError.create("Session ID is required", 400, statusText.FAIL));
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return next(appError.create("Payment not completed", 400, statusText.FAIL));
  }

  const userId = session.metadata.userId;
  const products = JSON.parse(session.metadata.products);
  const shippingAddress = session.metadata.shippingAddress;

  let orderProducts = [];
  let totalAmount = 0;

  for (const item of products) {
    const product = await Product.findById(item.productId);

    if (!product) {
      return next(appError.create(`Product not found: ${item.productId}`, 404, statusText.FAIL));
    }

    const price = product.discountPrice || product.price;

    orderProducts.push({
      product: product._id,
      quantity: item.quantity,
      price
    });

    totalAmount += price * item.quantity;

    // Deduct stock
    product.stock -= item.quantity;
    await product.save();
  }

  // Create order
  const order = new Order({
    user: userId,
    products: orderProducts,
    totalAmount,
    shippingAddress,
    paymentMethod: "stripe",
    status: "paid"
  });

  await order.save();

  // Add to user order history
  const user = await User.findById(userId);
  user.orderHistory.push(order._id);
  await user.save();

  res.json({
    status: statusText.SUCCESS,
    data: { order }
  });
});

module.exports = {
  createCheckoutSession,
  confirmStripePayment
};