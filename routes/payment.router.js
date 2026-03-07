// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { createCheckoutSession, confirmStripePayment } = require("../controllers/payment.controller");
const verifyToken = require("../middlewares/verifyToken");

router.post("/create-checkout-session", verifyToken, createCheckoutSession);
router.post("/confirm", verifyToken, confirmStripePayment);

module.exports = router;