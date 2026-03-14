const crypto = require("crypto");
const multer = require("multer");
const path = require("path");

// Storage configuration for disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const originalExtension = path.extname(file.originalname);
    const mimeExtension = file.mimetype.split("/")[1];
    const extension = originalExtension || `.${mimeExtension}`;
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const fileType = file.fieldname; // 'avatar', 'image', 'categoryImage', etc.
    const fileName = `${fileType}-${uniqueSuffix}${extension}`;
    cb(null, fileName);
  },
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const imageType = file.mimetype.split("/")[0];
  if (imageType === "image") {
    return cb(null, true);
  } else {
    return cb(new Error("File must be an image"), false);
  }
};

// Single file upload for user avatar/profile photo
const uploadAvatar = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("avatar");

// Single file upload for category image
const uploadCategoryImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("image");

// Multiple files upload for product images
const uploadProductImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).array("images", 5); // Max 5 images per product

module.exports = {
  uploadAvatar,
  uploadCategoryImage,
  uploadProductImages,
  storage,
  imageFileFilter,
};
