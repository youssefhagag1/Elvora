const Product = require('../models/products');
const asyncWrapper = require('../middlewares/asyncWrapper');
const AppError = require('../utils/appError');
const { SUCCESS, FAIL, ERROR } = require('../utils/statusText');

// Get all products with pagination
const getProducts = asyncWrapper(async (req, res, next) => {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { isActive: true };

    if (category) filter.category = category;

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $regex: search, $options: 'i' } }
        ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) filter.price.$lte = parseFloat(maxPrice);
        if (Object.keys(filter.price).length === 0) delete filter.price;
    }

    const skip = (pageNum - 1) * limitNum;
    const total = await Product.countDocuments(filter);

    let products = await Product.find(filter, { __v: 0 })
        .populate('category')
        .populate('seller')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

    products = products.map(p => {
        const obj = p.toObject();
        if (obj.seller) {
            delete obj.seller.password;
        }
        delete obj.images
        return obj;
    });

    res.status(200).json({
        status: SUCCESS,
        data: {
            products,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});

// Get products belonging to the authenticated seller
const getSellerProducts = asyncWrapper(async (req, res, next) => {
    const sellerId = req.user.id;
    const { page = 1, limit = 10, category, search, minPrice, maxPrice } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build filter object
    const filter = { seller: sellerId };

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $regex: search, $options: 'i' } }
        ];
    }

    // price filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
            filter.price.$gte = parseFloat(minPrice);
        }
        if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
            filter.price.$lte = parseFloat(maxPrice);
        }
        if (Object.keys(filter.price).length === 0) delete filter.price;
    }

    // Calculate skip value
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter, { __v: 0 })
        .populate('category')
        .populate('seller')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: SUCCESS,
        data: {
            products,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        }
    });
});

// Get single product by ID
const getOneProductById = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findById(id, { __v: 0 })
        .populate('category')
        .populate('seller')

    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    res.status(200).json({
        status: SUCCESS,
        data: {
            product
        }
    });
});

// Update product (seller only)
const updateProduct = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    // Check if current user is the seller
    if (product.seller.toString() !== req.user.id) {
        const error = new AppError('Access denied. Only the seller can update this product', 403, FAIL);
        return next(error);
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
        updates.images = req.files.map(file => file.filename);
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
    }).populate('category').populate('seller');

    res.status(200).json({
        status: SUCCESS,
        data: {
            product: updatedProduct
        }
    });
});

// Delete product (seller only)
const deleteProduct = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
        const error = new AppError('Product not found', 404, FAIL);
        return next(error);
    }

    // Check if current user is the seller or an admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        const error = new AppError('Access denied. Only the seller or an admin can delete this product', 403, FAIL);
        return next(error);
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    res.status(200).json({
        status: SUCCESS,
        data : null
    });
});

// Add new product (authenticated users)
const addProduct = asyncWrapper(async (req, res, next) => {
    const { title, description, price,discountPrice, category, tags, stock } = req.body;

    // Validate required fields
    if (!title || !price || !category) {
        const error = new AppError('Name, price, and category are required', 400, FAIL);
        return next(error);
    }

    // Extract image filenames from uploaded files
    const images = req.files && req.files.length > 0 
        ? req.files.map(file => file.filename)
        : [];

    // Create new product
    const newProduct = new Product({
        title,
        description,
        discountPrice,
        price,
        category,
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
        stock: stock || 0,
        images,
        seller: req.user.id,
        isActive: true
    });

    // Save product
    const product = await newProduct.save();
    
    // Populate seller and category info
    const populatedProduct = await product.populate('seller');
    await populatedProduct.populate('category');

    res.status(201).json({
        status: SUCCESS,
        data: {
            product:populatedProduct
        }
    });
});

module.exports = {
    getProducts,
    getOneProductById,
    getSellerProducts,
    addProduct,
    updateProduct,
    deleteProduct
};
