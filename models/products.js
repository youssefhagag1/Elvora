const mongoose = require("mongoose");

const normalizeImages = (images = []) => {
  if (!Array.isArray(images)) {
    return [];
  }

  return [...new Set(images.filter(Boolean))];
};

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        type: String,
        default: null,
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// include virtuals when converting documents to JSON or objects
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// virtual property that builds full URLs for the images
productSchema.virtual("photos").get(function () {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";
  return normalizeImages(this.images).map(
    (image) => `${baseURL}/uploads/${image}`,
  );
});

productSchema.pre("save", function () {
  this.images = normalizeImages(this.images);
});

productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.images) {
    update.images = normalizeImages(update.images);
  }

  if (update?.$set?.images) {
    update.$set.images = normalizeImages(update.$set.images);
  }
});

productSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.images;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Product", productSchema);
