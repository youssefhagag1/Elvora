const Category = require('../models/category');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const { SUCCESS, FAIL, ERROR } = require('../utils/statusText');

// Get all categories
const getCategories = asyncWrapper(async (req , res) => {
    const categories = await Category.find({} , {__v : 0})
    res.status(200).json({
        status: SUCCESS,
        data: {
            categories
        }
    });

})

// Get single category by ID
const getCategory = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const category = await Category.findById(id, { __v: 0 });

    if (!category) {
        const error = new AppError('Category not found', 404, FAIL);
        return next(error);
    }

    res.status(200).json({
        status: SUCCESS,
        data: {
            category
        }
    });
});

// Create new category
const createCategory = asyncWrapper(async (req, res, next) => {
    const { name, description, slug } = req.body;
        
    // Validate required fields
    if (!name || !description) {
        const error = new AppError('Name and description are required', 400, FAIL);
        return next(error);
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        const error = new AppError('Category already exists', 400, FAIL);
        return next(error);
    }

    // Get image from uploaded file if exists
    const image = req.file ? req.file.filename : null;

    // Create new category
    const category = new Category({
        name,
        description,
        image,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-')
    });

    await category.save();

    res.status(201).json({
        status: SUCCESS,
        data: {
            category
        }
    });
});

// Update category
const updateCategory = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    // Allowed fields to update
    const allowedFields = ['name', 'description', 'image', 'slug', 'isActive'];
    const updateFields = {};

    allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
            updateFields[field] = updates[field];
        }
    });

    // Handle image upload
    if (req.file) {
        updateFields.image = req.file.filename;
    }

    // If updating name, also update slug if not provided
    if (updateFields.name && !updateFields.slug) {
        updateFields.slug = updateFields.name.toLowerCase().replace(/\s+/g, '-');
    }

    // Check if updated name already exists (if name is being updated)
    if (updateFields.name) {
        const existingCategory = await Category.findOne({
            name: updateFields.name,
            _id: { $ne: id }
        });
        if (existingCategory) {
            const error = new AppError('Category name already exists', 400, FAIL);
            return next(error);
        }
    }

    const category = await Category.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
    );

    if (!category) {
        const error = new AppError('Category not found', 404, FAIL);
        return next(error);
    }

    res.status(200).json({
        status: SUCCESS,
        data: {
            category
        }
    });
});

// Delete category
const deleteCategory = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
        const error = new AppError('Category not found', 404, FAIL);
        return next(error);
    }

    res.status(200).json({
        status: SUCCESS,
        data : null
    });
});

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
