require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  // =========================
  // MEN
  // =========================

  {
    name: "Classic Oversized T-Shirt",
    brand: "Cartify",
    category: "T-Shirts",
    gender: "men",
    price: 799,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
    description:
      "Premium cotton oversized t-shirt for everyday comfort and casual styling.",
    stock: 25,
  },

  {
    name: "Minimal White Shirt",
    brand: "Cartify",
    category: "Shirts",
    gender: "men",
    price: 1299,
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop",
    description:
      "Clean minimal white shirt suitable for casual and formal looks.",
    stock: 20,
  },

  {
    name: "Premium Denim Jacket",
    brand: "Cartify",
    category: "Jackets",
    gender: "men",
    price: 2299,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop",
    description:
      "Premium denim jacket designed for versatile everyday styling.",
    stock: 10,
  },

  {
    name: "Men's Casual Hoodie",
    brand: "Cartify",
    category: "Hoodies",
    gender: "men",
    price: 1599,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop",
    description:
      "Comfortable casual hoodie with a clean modern fit.",
    stock: 18,
  },

  {
    name: "Men's Classic Jeans",
    brand: "Cartify",
    category: "Jeans",
    gender: "men",
    price: 1799,
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop",
    description:
      "Classic denim jeans designed for everyday comfort.",
    stock: 14,
  },

  // =========================
  // WOMEN
  // =========================

  {
    name: "Elegant Women's Dress",
    brand: "Cartify",
    category: "Dresses",
    gender: "women",
    price: 1899,
    image:
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1000&auto=format&fit=crop",
    description:
      "Elegant everyday dress with a modern silhouette.",
    stock: 15,
  },

  {
    name: "Women's Casual Outfit",
    brand: "Cartify",
    category: "Tops",
    gender: "women",
    price: 1499,
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1000&auto=format&fit=crop",
    description:
      "Comfortable casual outfit designed for everyday styling.",
    stock: 18,
  },

  {
    name: "Women's Denim Jacket",
    brand: "Cartify",
    category: "Jackets",
    gender: "women",
    price: 2199,
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=1000&auto=format&fit=crop",
    description:
      "Stylish women's denim jacket for casual everyday outfits.",
    stock: 8,
  },

  {
    name: "Women's Classic Jeans",
    brand: "Cartify",
    category: "Jeans",
    gender: "women",
    price: 1699,
    image:
      "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?q=80&w=1000&auto=format&fit=crop",
    description:
      "Comfortable classic jeans designed for modern everyday styling.",
    stock: 12,
  },

  {
    name: "Women High Waist Jeans",
    brand: "Cartify",
    category: "Jeans",
    gender: "women",
    price: 1299,
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
    description:
      "Premium stretchable denim jeans designed for everyday comfort.",
    stock: 15,
  },

  // =========================
  // FOOTWEAR
  // =========================

  {
    name: "Classic Sneakers",
    brand: "Cartify",
    category: "Footwear",
    gender: "unisex",
    price: 2499,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    description:
      "Classic sneakers with a comfortable everyday design.",
    stock: 30,
  },

  {
    name: "White Running Shoes",
    brand: "Cartify",
    category: "Footwear",
    gender: "unisex",
    price: 2899,
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop",
    description:
      "Lightweight white running shoes designed for daily movement.",
    stock: 20,
  },

  {
    name: "Casual Black Sneakers",
    brand: "Cartify",
    category: "Footwear",
    gender: "unisex",
    price: 2199,
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1000&auto=format&fit=crop",
    description:
      "Minimal black sneakers for everyday casual outfits.",
    stock: 0,
  },

  // =========================
  // ACCESSORIES
  // =========================

  {
    name: "Leather Handbag",
    brand: "Cartify",
    category: "Accessories",
    gender: "women",
    price: 2199,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop",
    description:
      "Premium everyday handbag with a clean modern design.",
    stock: 12,
  },

  {
    name: "Classic Sunglasses",
    brand: "Cartify",
    category: "Accessories",
    gender: "unisex",
    price: 999,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop",
    description:
      "Classic black sunglasses with a timeless frame.",
    stock: 25,
  },

  {
    name: "Leather Wallet",
    brand: "Cartify",
    category: "Accessories",
    gender: "men",
    price: 899,
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop",
    description:
      "Compact leather wallet with multiple card slots.",
    stock: 16,
  },

  {
    name: "Minimal Wrist Watch",
    brand: "Cartify",
    category: "Accessories",
    gender: "unisex",
    price: 2999,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
    description:
      "Minimal wrist watch designed for a timeless everyday look.",
    stock: 7,
  },
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Product.deleteMany({});

    console.log("Old products deleted");

    await Product.insertMany(products);

    console.log(
      `${products.length} products inserted successfully`
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("SEED PRODUCTS ERROR:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedProducts();