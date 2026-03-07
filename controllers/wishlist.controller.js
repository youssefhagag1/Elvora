const Wishlist = require('../models/whislist');
const Cart = require('../models/carts');
const Product = require('../models/products');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const { SUCCESS, FAIL, ERROR } = require('../utils/statusText');

// Add product to wishlist
const addToWishlist = asyncWrapper(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId) {
        const error = new AppError('Product ID is required', 400, FAIL);
        return next(error);
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    // Find or create user's wishlist
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
        // Create new wishlist
        wishlist = new Wishlist({
            user: userId,
            products: [productId]
        });
    } else {
        // Check if product already in wishlist
        if (wishlist.products.includes(productId)) {
            const error = new AppError('Product already in wishlist', 400, FAIL);
            return next(error);
        }
        // Add product to wishlist
        wishlist.products.push(productId);
    }

    await wishlist.save();

    // Populate wishlist with product details
    const populatedWishlist = await wishlist.populate('products', 'name price images stock category');

    res.status(200).json({
        status: SUCCESS,
        data: {
            wishlist: populatedWishlist
        }
    });
});

// Get user's wishlist
const getUserWishlist = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId }, { __v: 0 })
        .populate('products', 'name price images stock category');

    if (!wishlist) {
        return res.status(200).json({
            status: SUCCESS,
            data: {
                wishlist: {
                    user: userId,
                    products: []
                }
            }
        });
    }

    res.status(200).json({
        status: SUCCESS,
        data: {
            wishlist
        }
    });
});

// Remove product from wishlist
const removeFromWishlist = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!productId) {
        const error = new AppError('Product ID is required', 400, FAIL);
        return next(error);
    }

    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        const error = new AppError('Wishlist not found', 404, FAIL);
        return next(error);
    }

    // Check if product is in wishlist
    if (!wishlist.products.includes(productId)) {
        const error = new AppError('Product not found in wishlist', 404, FAIL);
        return next(error);
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();

    // Populate wishlist with product details
    const populatedWishlist = await wishlist.populate('products', 'name price images stock category');

    res.status(200).json({
        status: SUCCESS,
        data: {
            wishlist: populatedWishlist
        }
    });
});

// Clear user's wishlist
const clearWishlist = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        const error = new AppError('Wishlist not found', 404, FAIL);
        return next(error);
    }

    // Remove all products from wishlist
    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
        status: SUCCESS,
        data: null
    });
});

// Transfer product from wishlist to cart
const transferToCart = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;
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

    // Check if product is in wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist || !wishlist.products.includes(productId)) {
        const error = new AppError('Product not found in wishlist', 404, FAIL);
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

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();

    // Populate updated cart with product details
    const populatedCart = await cart.populate('products.product', 'name price stock images');

    res.status(200).json({
        status: SUCCESS,
        data: {
            cart: populatedCart,
            message: 'Product transferred from wishlist to cart'
        }
    });
});

module.exports = {
    addToWishlist,
    getUserWishlist,
    removeFromWishlist,
    clearWishlist,
    transferToCart
};
