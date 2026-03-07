const Favorite = require('../models/favorites');
const Product = require('../models/products');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const { SUCCESS, FAIL, ERROR } = require('../utils/statusText');

// Add product to favorites
const addToFavorites = asyncWrapper(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
        const error = new AppError('Product ID is required', 400, FAIL);
        return next(error);
    }

    const product = await Product.findById(productId);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    let fav = await Favorite.findOne({ user: userId });
    if (!fav) {
        fav = new Favorite({ user: userId, products: [productId] });
    } else {
        if (fav.products.includes(productId)) {
            const error = new AppError('Product already in favorites', 400, FAIL);
            return next(error);
        }
        fav.products.push(productId);
    }

    await fav.save();
    const populated = await fav.populate('products', 'name price images');
    res.status(200).json({ status: SUCCESS, data: { favorites: populated } });
});

// Get user's favorites
const getUserFavorites = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const fav = await Favorite.findOne({ user: userId }).populate('products', 'name price images');
    if (!fav) {
        return res.status(200).json({ status: SUCCESS, data: { favorites: { user: userId, products: [] } } });
    }
    res.status(200).json({ status: SUCCESS, data: { favorites: fav } });
});

// Remove product from favorites
const removeFromFavorites = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;

    if (!productId) {
        const error = new AppError('Product ID is required', 400, FAIL);
        return next(error);
    }

    const fav = await Favorite.findOne({ user: userId });
    if (!fav) {
        const error = new AppError('Favorites not found', 404, FAIL);
        return next(error);
    }

    if (!fav.products.includes(productId)) {
        const error = new AppError('Product not in favorites', 404, FAIL);
        return next(error);
    }

    fav.products = fav.products.filter(id => id.toString() !== productId);
    await fav.save();
    const populated = await fav.populate('products', 'name price images');
    res.status(200).json({ status: SUCCESS, data: { favorites: populated } });
});

// Clear favorites
const clearFavorites = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const fav = await Favorite.findOne({ user: userId });
    if (!fav) {
        const error = new AppError('Favorites not found', 404, FAIL);
        return next(error);
    }
    fav.products = [];
    await fav.save();
    res.status(200).json({ status: SUCCESS, data: null });
});

module.exports = {
    addToFavorites,
    getUserFavorites,
    removeFromFavorites,
    clearFavorites
};