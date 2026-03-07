const User = require('../models/users');
const asyncWrapper = require("../middlewares/asyncWrapper")
const AppError = require('../utils/appError');
const {SUCCESS , FAIL} = require("../utils/statusText")

const getAllUsers = asyncWrapper(async (req, res , next) => {
    // pagination and optional filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }
    const users = await User.find(filter , { password: 0 , __v: 0 }).skip(skip).limit(limit);
    res.status(200).json({ status: SUCCESS, data: users });
}
)

const getUserById = asyncWrapper(async (req, res , next) => {
    const user = await User.findById(req.params.id , { password: 0 , __v: 0 });
    if (!user) {
        const error = new AppError('User not found', 404 , FAIL);
        return next(error);
    }
    res.status(200).json({ status: SUCCESS, data: user });
})

const deleteUserById = asyncWrapper(async (req, res , next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        const error = new AppError('User not found', 404 , FAIL);
        return next(error);
    }
    res.status(200).json({ status: SUCCESS, data : null });
});

// Approve (activate) user
const approveUser = asyncWrapper(async (req, res , next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        const error = new AppError('User not found', 404 , FAIL);
        return next(error);
    }
    user.isActive = true;
    await user.save();
    res.status(200).json({ status: SUCCESS, data: user });
});

// Restrict (deactivate) user
const restrictUser = asyncWrapper(async (req, res , next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        const error = new AppError('User not found', 404 , FAIL);
        return next(error);
    }
    user.isActive = false;
    await user.save();
    res.status(200).json({ status: SUCCESS, data: user });
});

module.exports = {
    getAllUsers,
    getUserById,
    deleteUserById,
    approveUser,
    restrictUser
}