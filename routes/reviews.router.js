const express = require('express');
const {
    getProductReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
    getUserReviews
} = require('../controllers/reviews.controller');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

// Routes for product reviews
router.route('/product/:productId')
    .get(getProductReviews)
    .post(verifyToken, addReview);

// Routes for current user's reviews
router.route('/me').get(verifyToken, getUserReviews);

// Routes for single review
router.route('/:reviewId')
    .get(getReview)
    .patch(verifyToken, updateReview)
    .delete(verifyToken, deleteReview);

module.exports = router;
