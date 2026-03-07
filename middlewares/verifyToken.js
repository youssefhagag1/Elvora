const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { FAIL } = require('../utils/statusText');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error = new AppError('Access denied. No token provided', 401, FAIL);
        return next(error);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        const error = new AppError('Invalid token', 401, FAIL);
        return next(error);
    }
};

module.exports = verifyToken;
