const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      default: "unisex",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Main product image
    image: {
      type: String,
      required: true,
      trim: true,
    },

    // Additional gallery images
    images: {
      type: [String],
      default: [],
      set: (images) =>
        Array.isArray(images)
          ? [
              ...new Set(
                images
                  .map((image) => String(image).trim())
                  .filter(Boolean)
              ),
            ]
          : [],
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    sizes: {
      type: [String],
      default: [],
      set: (sizes) =>
        Array.isArray(sizes)
          ? [
              ...new Set(
                sizes
                  .map((size) =>
                    String(size).trim().toUpperCase()
                  )
                  .filter(Boolean)
              ),
            ]
          : [],
    },

    colors: {
      type: [String],
      default: [],
      set: (colors) =>
        Array.isArray(colors)
          ? [
              ...new Set(
                colors
                  .map((color) => String(color).trim())
                  .filter(Boolean)
              ),
            ]
          : [],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);