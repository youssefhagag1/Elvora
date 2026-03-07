const User = require('../models/users');
const asyncWrapper = require("../middlewares/asyncWrapper")
const AppError = require('../utils/appError');
const {SUCCESS , FAIL , ERROR} = require("../utils/statusText")

const getMyProfile = asyncWrapper(async (req, res , next) => {
    const user = await User.findById(req.user.id , { password: 0 , __v: 0 });
    if (!user) {
        const error = new AppError('User not found', 404 , FAIL);
        return next(error);
    }
    res.status(200).json({ status: SUCCESS, data: user });
})

const updateProfile = asyncWrapper(async (req, res, next) => {
    const { name, phone, street, city, state, postalCode, country,
            facebook, twitter, instagram, linkedin } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        const error = new AppError('User not found', 404, FAIL);
        return next(error);
    }

    // basic fields
    user.name = name || user.name;
    user.phone = phone !== undefined ? phone : user.phone;

    // address fields
    user.address = user.address || {};
    if (street !== undefined) user.address.street = street;
    if (city !== undefined) user.address.city = city;
    if (state !== undefined) user.address.state = state;
    if (postalCode !== undefined) user.address.postalCode = postalCode;
    if (country !== undefined) user.address.country = country;

    // social media links
    user.socialMediaLinks = user.socialMediaLinks || {};
    if (facebook !== undefined) user.socialMediaLinks.facebook = facebook;
    if (twitter !== undefined) user.socialMediaLinks.twitter = twitter;
    if (instagram !== undefined) user.socialMediaLinks.instagram = instagram;
    if (linkedin !== undefined) user.socialMediaLinks.linkedin = linkedin;

    // photo
    if (req.file) {
        user.photo = req.file.filename;
    }

    await user.save();
    res.status(200).json({ status: SUCCESS, data: user });
});
module.exports = {
    getMyProfile,
    updateProfile
}