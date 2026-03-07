const express = require('express');
const {
    addToCart,
    getUserCart,
    removeFromCart,
    clearCart,
    updateQuantity
} = require('../controllers/cart.controller');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

// Routes for user's cart
router.route('/')
    .get(verifyToken, getUserCart)
    .post(verifyToken, addToCart)
    .delete(verifyToken, clearCart);

router.route('/:productId')
        .patch( verifyToken, updateQuantity)
        .delete( verifyToken, removeFromCart);


module.exports = router;
