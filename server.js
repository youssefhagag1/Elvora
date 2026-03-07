const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const {ERROR} = require("./utils/appError")
require('dotenv').config();
const app = express();
app.use(cors({
  origin: "http://localhost:4200"
}));
app.use(express.json());

// serve static files (avatars) under a virtual path
app.use("/uploads" , express.static(path.join(__dirname , "uploads")));

// Routes
const authRoutes = require('./routes/auth.router');
const userRoutes = require('./routes/users.router');
const profileRoutes = require('./routes/profile.router');
const productRoutes = require('./routes/products.router');
const categoryRoutes = require('./routes/category.router');
const reviewRoutes = require('./routes/reviews.router');
const cartRoutes = require('./routes/carts.router');
const wishlistRoutes = require('./routes/wishlists.router');
const favoriteRoutes = require('./routes/favorites.router');
const checkoutRoutes = require('./routes/checkout.router');
const ordersRoutes = require('./routes/orders.router');
const paymentRoutes = require('./routes/payment.router')

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payment', paymentRoutes);


app.use((req , res , next) => {
    const error = new AppError("Resource Not Available" , 404, FAIL );
    return next(error);
})

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500; 
    const statusText = error.statusText || ERROR; 

    res.status(statusCode).json({
        status: statusText,
        data: {
            message: error.message || "Internal Server Error"
        }
    });
});

const PORT = process.env.PORT || 3000;


mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});



