const Cart = require('../models/carts');
const Product = require('../models/products');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const { SUCCESS, FAIL, ERROR } = require('../utils/statusText');

// Add product to cart
const addToCart = asyncWrapper(async (req, res, next) => {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!productId) {
        const error = new AppError('Product ID is required', 400, FAIL);
        return next(error);
    }

    if (quantity < 1) {
        const error = new AppError('Quantity must be at least 1', 400, FAIL);
        return next(error);
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    // Check stock availability
    if (product.stock < quantity) {
        const error = new AppError('Insufficient stock available', 400, FAIL);
        return next(error);
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        // Create new cart
        cart = new Cart({
            user: userId,
            products: [{ product: productId, quantity }]
        });
    } else {
        // Check if product already in cart
        const existingProduct = cart.products.find(
            item => item.product.toString() === productId
        );

        if (existingProduct) {
            // Update quantity if product is already in cart
            const newQuantity = existingProduct.quantity + quantity;
            if (product.stock < newQuantity) {
                const error = new AppError('Insufficient stock available', 400, FAIL);
                return next(error);
            }
            existingProduct.quantity = newQuantity;
        } else {
            // Add new product to cart
            cart.products.push({ product: productId, quantity });
        }
    }

    await cart.save();

    // Populate cart with product details
    const populatedCart = await cart.populate('products.product', 'name price stock images');

    res.status(200).json({
        status: SUCCESS,
        data: {
            cart: populatedCart
        }
    });
});

// Get user's cart
const getUserCart = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId }, { __v: 0 })
        .populate('products.product', 'name price stock images category');

    if (!cart) {
        return res.status(200).json({
            status: SUCCESS,
            data: {
                cart: {
                    user: userId,
                    products: []
                }
            }
        });
    }

    // Calculate total price
    let totalPrice = 0;
    if (cart.products && cart.products.length > 0) {
        for (const item of cart.products) {
            if (item.product) {
                totalPrice += item.product.price * item.quantity;
            }
        }
    }

    res.status(200).json({
        status: SUCCESS,
        data: {
            cart,
            totalPrice
        }
    });
});

// Remove product from cart
const removeFromCart = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!productId) {
        const error = new AppError('Product ID is required', 400, FAIL);
        return next(error);
    }

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        const error = new AppError('Cart not found', 404, FAIL);
        return next(error);
    }

    // Find and remove product from cart
    const productIndex = cart.products.findIndex(
        item => item.product.toString() === productId
    );

    if (productIndex === -1) {
        const error = new AppError('Product not found in cart', 404, FAIL);
        return next(error);
    }

    cart.products.splice(productIndex, 1);
    await cart.save();

    // Populate cart with product details
    const populatedCart = await cart.populate('products.product', 'name price stock images');

    res.status(200).json({
        status: SUCCESS,
        data: {
            cart: populatedCart
        }
    });
});

// Clear user's cart
const clearCart = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        const error = new AppError('Cart not found', 404, FAIL);
        return next(error);
    }

    // Remove all products from cart
    cart.products = [];
    await cart.save();

    res.status(200).json({
        status: SUCCESS,
        data: null
    });
});

// Update product quantity in cart
const updateQuantity = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId || !action) {
        const error = new AppError('Product ID and action (+ or -) are required', 400, FAIL);
        return next(error);
    }

    if (action !== '+' && action !== '-') {
        const error = new AppError('Action must be + (increase) or - (decrease)', 400, FAIL);
        return next(error);
    }

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        const error = new AppError('Cart not found', 404, FAIL);
        return next(error);
    }

    // Find product in cart
    const cartProduct = cart.products.find(
        item => {
           return item.product.toString() == productId
        }
    );

    if (!cartProduct) {
        const error = new AppError('Product not found in cart', 404, FAIL);
        return next(error);
    }

    // Get product to check stock
    const product = await Product.findById(productId);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    // Update quantity based on action
    if (action === '+') {
        // Increase quantity
        if (product.stock < cartProduct.quantity + 1) {
            const error = new AppError('Insufficient stock available', 400, FAIL);
            return next(error);
        }
        cartProduct.quantity += 1;
    } else if (action === '-') {
        // Decrease quantity
        if (cartProduct.quantity <= 1) {
            const error = new AppError('Quantity cannot be less than 1. Use remove endpoint to delete product', 400, FAIL);
            return next(error);
        }
        cartProduct.quantity -= 1;
    }

    await cart.save();

    // Populate cart with product details
    const populatedCart = await cart.populate('products.product', 'name price stock images');

    res.status(200).json({
        status: SUCCESS,
        data: {
            cart: populatedCart
        }
    });
});

module.exports = {
    addToCart,
    getUserCart,
    removeFromCart,
    clearCart,
    updateQuantity
};
