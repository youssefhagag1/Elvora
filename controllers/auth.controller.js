const User = require('../models/users');
const bcrypt = require("bcryptjs");
const generateToken = require('../utils/generateToken');
const asyncWrapper = require("../middlewares/asyncWrapper")
const AppError = require('../utils/appError');
const {SUCCESS , FAIL , ERROR} = require("../utils/statusText")
// Create a new user
const register = asyncWrapper(async (req, res , next) => {
    const { name, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new AppError('User already exists', 400 , FAIL);
        return next(error);
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //role is admin or user or seller based on the email
    let role = 'user';

    if (email.includes('admin')) {
        role = 'admin';
    } else if (email.includes('seller')) {
        role = 'seller';
    }
    // Create a new user
    const user = new User({
        name,
        email,
        password: hashedPassword,
        role
    });
    const token = generateToken({ id: user._id, email: user.email , role : user.role });



    // Save the user to the database
    await user.save();
    res.status(201).json({ status: SUCCESS, data: { token } });
})


const login = asyncWrapper(async (req, res , next) => {
    const { email, password } = req.body;
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
        const error = new AppError('Invalid email or password', 400 , FAIL);
        return next(error);
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new AppError('Invalid email or password', 400 , FAIL);
        return next(error);
    }
    const token = generateToken({ id: user._id, email: user.email , role : user.role });
    res.status(200).json({ status: SUCCESS, data: { token } });
})



module.exports = {
    register,
    login
};