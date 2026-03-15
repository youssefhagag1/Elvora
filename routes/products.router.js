const express = require("express");
const {
  getProducts,
  getOneProductById,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  addProduct,
} = require("../controllers/products.controller");
const verifyToken = require("../middlewares/verifyToken");
const allowTo = require("../middlewares/allowTo");
const { uploadProductImages } = require("../utils/multerConfig");
const router = express.Router();

// Public routes
router.get("/", getProducts);

// Seller-specific listing
router.get("/seller", verifyToken, allowTo("seller"), getSellerProducts);

router.post(
  "/",
  verifyToken,
  allowTo("seller", "admin"),
  uploadProductImages,
  addProduct,
);
router
  .route("/:id")
  .get(getOneProductById)
  .patch(verifyToken, uploadProductImages, updateProduct)
  .delete(verifyToken, deleteProduct);

module.exports = router;
