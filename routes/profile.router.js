const express = require('express');
const { uploadAvatar } = require('../utils/multerConfig');
const {getMyProfile ,  updateProfile} = require("../controllers/profile.controller");
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.get('/me' ,verifyToken, getMyProfile);
router.put('/update',verifyToken, uploadAvatar, updateProfile);

module.exports = router;
