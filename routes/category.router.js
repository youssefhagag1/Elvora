const express = require("express");
const { uploadCategoryImage } = require('../utils/multerConfig');
const router = express.Router();
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');
const verifyToken = require("../middlewares/verifyToken");
const allowTo = require("../middlewares/allowTo");

router.route('/')
    .get(getCategories)
    .post(verifyToken , allowTo("admin") , uploadCategoryImage, createCategory);

router.route('/:id')
    .get(getCategory)
    .patch(verifyToken , allowTo("admin") , uploadCategoryImage, updateCategory)
    .delete(verifyToken , allowTo("admin")  , deleteCategory);

module.exports = router;

