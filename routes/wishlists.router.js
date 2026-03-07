const express = require('express');
const {
    addToWishlist,
    getUserWishlist,
    removeFromWishlist,
    clearWishlist,
    transferToCart
} = require('../controllers/wishlist.controller');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

// Routes for user's wishlist
router.route('/')
    .get(verifyToken, getUserWishlist)
    .post(verifyToken, addToWishlist)
    .delete(verifyToken, clearWishlist);

// Route to transfer product from wishlist to cart
router.post('/:productId/transfer', verifyToken, transferToCart);

// Route to remove product from wishlist
router.delete('/:productId', verifyToken, removeFromWishlist);

module.exports = router;
