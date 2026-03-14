require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Category = require("../models/category");
const Product = require("../models/products");
const User = require("../models/users");

const uploadsDir = path.join(__dirname, "..", "uploads");

const seedCatalog = [
  {
    category: {
      name: "Clothing",
      slug: "clothing",
      description:
        "Daily-wear staples with reliable fits, clean fabrics, and easy layering pieces.",
      image: "seed-category-clothing.svg",
    },
    product: {
      title: "Desert Loom Overshirt",
      description:
        "A structured cotton overshirt with a relaxed silhouette, matte buttons, and an easy everyday weight.",
      price: 78,
      discountPrice: 64,
      stock: 32,
      tags: ["cotton", "overshirt", "casual"],
      images: ["seed-product-clothing-desert-loom.svg"],
    },
    theme: {
      background: "#F0E1CE",
      foreground: "#6E442D",
      accent: "#C37445",
    },
  },
  {
    category: {
      name: "Electronics",
      slug: "electronics",
      description:
        "Useful devices and accessories chosen for everyday performance instead of spec-sheet noise.",
      image: "seed-category-electronics.svg",
    },
    product: {
      title: "Pulse Arc Speaker",
      description:
        "A compact wireless speaker with balanced sound, tactile controls, and all-day battery life.",
      price: 149,
      discountPrice: 129,
      stock: 18,
      tags: ["audio", "wireless", "portable"],
      images: ["seed-product-electronics-pulse-arc.svg"],
    },
    theme: {
      background: "#D9ECFF",
      foreground: "#0A3A66",
      accent: "#1D77C3",
    },
  },
  {
    category: {
      name: "Home Decor",
      slug: "home-decor",
      description:
        "Functional decorative objects that bring warmth, texture, and calm into everyday spaces.",
      image: "seed-category-home-decor.svg",
    },
    product: {
      title: "Halo Glass Lantern",
      description:
        "A smoked-glass lantern with a brushed metal frame that works as a centerpiece or ambient accent.",
      price: 56,
      discountPrice: 46,
      stock: 24,
      tags: ["decor", "glass", "ambient"],
      images: ["seed-product-home-decor-halo-lantern.svg"],
    },
    theme: {
      background: "#F5E8D8",
      foreground: "#5A3728",
      accent: "#A86D42",
    },
  },
  {
    category: {
      name: "Beauty",
      slug: "beauty",
      description:
        "Skin and self-care essentials focused on texture, comfort, and repeatable routines.",
      image: "seed-category-beauty.svg",
    },
    product: {
      title: "Velvet Bloom Serum",
      description:
        "A lightweight hydration serum with a soft finish designed for morning and evening use.",
      price: 42,
      discountPrice: 35,
      stock: 40,
      tags: ["serum", "skincare", "hydrating"],
      images: ["seed-product-beauty-velvet-bloom.svg"],
    },
    theme: {
      background: "#FFE3EA",
      foreground: "#8A3450",
      accent: "#D45D82",
    },
  },
  {
    category: {
      name: "Sports",
      slug: "sports",
      description:
        "Training-ready essentials built for movement, recovery, and a consistent routine.",
      image: "seed-category-sports.svg",
    },
    product: {
      title: "Stride Flex Mat",
      description:
        "A high-grip training mat with dense cushioning, clean lines, and a roll-and-carry strap.",
      price: 68,
      discountPrice: 54,
      stock: 21,
      tags: ["fitness", "mat", "training"],
      images: ["seed-product-sports-stride-flex.svg"],
    },
    theme: {
      background: "#DDF4E4",
      foreground: "#1F5A34",
      accent: "#4AA56B",
    },
  },
  {
    category: {
      name: "Books",
      slug: "books",
      description:
        "Titles selected to feel collectible on a shelf and rewarding to spend time with.",
      image: "seed-category-books.svg",
    },
    product: {
      title: "Northbound Notes",
      description:
        "A clothbound travel journal with archival pages, stitched binding, and subtle foil details.",
      price: 28,
      discountPrice: 22,
      stock: 55,
      tags: ["journal", "stationery", "travel"],
      images: ["seed-product-books-northbound-notes.svg"],
    },
    theme: {
      background: "#F9F0D8",
      foreground: "#5F4313",
      accent: "#C2922D",
    },
  },
];

const createPlaceholderSvg = (title, theme) =>
  `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" fill="none">
  <rect width="1200" height="900" rx="48" fill="${theme.background}"/>
  <circle cx="980" cy="180" r="130" fill="${theme.accent}" fill-opacity="0.18"/>
  <circle cx="170" cy="730" r="180" fill="${theme.foreground}" fill-opacity="0.08"/>
  <rect x="110" y="120" width="980" height="660" rx="40" fill="white" fill-opacity="0.5"/>
  <text x="120" y="380" fill="${theme.foreground}" font-family="Segoe UI, Arial, sans-serif" font-size="74" font-weight="700">${title}</text>
  <text x="120" y="460" fill="${theme.foreground}" fill-opacity="0.72" font-family="Segoe UI, Arial, sans-serif" font-size="30">Seeded placeholder image for Elvora</text>
  <rect x="120" y="520" width="240" height="14" rx="7" fill="${theme.accent}"/>
  <rect x="120" y="566" width="420" height="14" rx="7" fill="${theme.foreground}" fill-opacity="0.18"/>
  <rect x="120" y="602" width="360" height="14" rx="7" fill="${theme.foreground}" fill-opacity="0.12"/>
</svg>
`.trimStart();

const ensureFile = (fileName, title, theme) => {
  const filePath = path.join(uploadsDir, fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createPlaceholderSvg(title, theme), "utf8");
  }
};

const ensureSeedAssets = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const entry of seedCatalog) {
    ensureFile(entry.category.image, entry.category.name, entry.theme);
    for (const image of entry.product.images) {
      ensureFile(image, entry.product.title, entry.theme);
    }
  }
};

const ensureSeedSeller = async () => {
  const email = "seed.seller@elvora.com";
  const existingSeller = await User.findOne({ email });

  if (existingSeller) {
    return existingSeller;
  }

  const hashedPassword = await bcrypt.hash("SeedSeller123!", 10);

  return User.create({
    name: "Elvora Seed Seller",
    email,
    password: hashedPassword,
    role: "seller",
    photo: "default.png",
  });
};

const upsertCategory = async ({ category }) => {
  const filter = category.slug
    ? { slug: category.slug }
    : { name: category.name };

  return Category.findOneAndUpdate(
    filter,
    {
      $set: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        isActive: true,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
};

const upsertProduct = async ({ product }, categoryId, sellerId) => {
  return Product.findOneAndUpdate(
    {
      title: product.title,
      category: categoryId,
    },
    {
      $set: {
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        tags: product.tags,
        images: product.images,
        seller: sellerId,
        isActive: true,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );
};

const seedDatabase = async () => {
  ensureSeedAssets();

  await mongoose.connect(process.env.MONGO_URL);

  const seller = await ensureSeedSeller();

  for (const entry of seedCatalog) {
    const category = await upsertCategory(entry);
    await upsertProduct(entry, category._id, seller._id);
  }

  const categoryCount = await Category.countDocuments({
    slug: { $in: seedCatalog.map((entry) => entry.category.slug) },
  });
  const productCount = await Product.countDocuments({
    title: { $in: seedCatalog.map((entry) => entry.product.title) },
  });

  console.log(
    JSON.stringify(
      {
        seededCategories: categoryCount,
        seededProducts: productCount,
        seedSellerEmail: seller.email,
      },
      null,
      2,
    ),
  );
};

seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
