const Review = require('../models/reviews');
const Product = require('../models/products');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const { SUCCESS, FAIL, ERROR } = require('../utils/statusText');

// Get all reviews for a product with pagination
const getProductReviews = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    // Calculate skip value
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Review.countDocuments({ product: productId });

    // Fetch reviews with pagination
    const reviews = await Review.find({ product: productId }, { __v: 0 })
        .populate('user', 'name avatar')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: SUCCESS,
        data: {
            reviews,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});

// Get single review by ID
const getReview = asyncWrapper(async (req, res, next) => {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId, { __v: 0 })
        .populate('user')
        .populate('product');

    if (!review) {
        const error = new AppError('Review not found', 404, FAIL);
        return next(error);
    }

    res.status(200).json({
        status: SUCCESS,
        data: {
            review
        }
    });
});

// Create new review for a product
const addReview = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    // Validate required fields
    if (!rating || !title || !comment) {
        const error = new AppError('Rating, title, and comment are required', 400, FAIL);
        return next(error);
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
        const error = new AppError('Rating must be between 1 and 5', 400, FAIL);
        return next(error);
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
        product: productId,
        user: req.user.id
    });

    if (existingReview) {
        const error = new AppError('You have already reviewed this product', 400, FAIL);
        return next(error);
    }

    // Create new review
    const review = new Review({
        rating,
        title,
        comment,
        user: req.user.id,
        product: productId
    });

    await review.save();

    // Populate user and product info
    const populatedReview = await review.populate('user')
    await populatedReview.populate('product');

    res.status(201).json({
        status: SUCCESS,
        data: {
            review: populatedReview
        }
    });
});

// Update review (owner only)
const updateReview = asyncWrapper(async (req, res, next) => {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
        const error = new AppError('Review not found', 404, FAIL);
        return next(error);
    }

    // Check if current user is the review owner
    if (review.user.toString() !== req.user.id) {
        const error = new AppError('Access denied. Only the review owner can update this review', 403, FAIL);
        return next(error);
    }

    // Validate rating if provided
    if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
            const error = new AppError('Rating must be between 1 and 5', 400, FAIL);
            return next(error);
        }
        review.rating = rating;
    }

    // Update fields
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Populate user and product info
    const updatedReview = await review.populate('user')
    await updatedReview.populate('product');

    res.status(200).json({
        status: SUCCESS,
        data: {
            review: updatedReview
        }
    });
});

// Delete review (owner only)
const deleteReview = asyncWrapper(async (req, res, next) => {
    const { reviewId } = req.params;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
        const error = new AppError('Review not found', 404, FAIL);
        return next(error);
    }

    // Check if current user is the review owner
    if (review.user.toString() !== req.user.id) {
        const error = new AppError('Access denied. Only the review owner can delete this review', 403, FAIL);
        return next(error);
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
        status: SUCCESS,
        data: null
    });
});

// Get all reviews written by current user
const getUserReviews = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const skip = (pageNum - 1) * limitNum;
    const total = await Review.countDocuments({ user: userId });

    const reviews = await Review.find({ user: userId }, { __v: 0 })
        .populate('product')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: SUCCESS,
        data: {
            reviews,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});

module.exports = {
    getProductReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
    getUserReviews,
    deleteReview
};
