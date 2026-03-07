const express = require('express');
const {
    addToFavorites,
    getUserFavorites,
    removeFromFavorites,
    clearFavorites
} = require('../controllers/favorites.controller');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.route('/')
    .get(verifyToken, getUserFavorites)
    .post(verifyToken, addToFavorites)
    .delete(verifyToken, clearFavorites);

router.delete('/:productId', verifyToken, removeFromFavorites);

module.exports = router;
