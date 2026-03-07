const express = require('express');
const router = express.Router();
const { checkoutSingleProduct, checkoutMultipleProducts } = require('../controllers/checkout.controller');
const verifyToken = require('../middlewares/verifyToken');

router.post('/single', verifyToken, checkoutSingleProduct);
router.post('/multiple', verifyToken, checkoutMultipleProducts);

module.exports = router;