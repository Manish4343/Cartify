const mongoose = require("mongoose");
const Product = require("../models/Product");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const cleanString = (value) => {
  return String(value ?? "").trim();
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
};

const normalizeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    ),
  ];
};

const normalizeSizes = (value) => {
  return [
    ...new Set(
      normalizeArray(value).map((size) =>
        size.toUpperCase()
      )
    ),
  ];
};

const normalizeColors = (value) => {
  return [
    ...new Set(
      normalizeArray(value)
    ),
  ];
};

// =====================================================
// GET ALL PRODUCTS
// =====================================================

const getProducts = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      gender = "",
      featured,
      active,
    } = req.query;

    const filter = {};

    // =================================================
    // SEARCH
    // =================================================

    if (cleanString(search)) {
      const searchText = cleanString(search);

      const regex = new RegExp(
        searchText.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        ),
        "i"
      );

      filter.$or = [
        { name: regex },
        { brand: regex },
        { category: regex },
        { description: regex },
        { gender: regex },
      ];
    }

    // =================================================
    // CATEGORY
    // =================================================

    if (cleanString(category)) {
      const categoryText = cleanString(category);

      filter.category = new RegExp(
        `^${categoryText.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        "i"
      );
    }

    // =================================================
    // GENDER
    // =================================================

    if (cleanString(gender)) {
      const normalizedGender =
        cleanString(gender).toLowerCase();

      if (
        !["men", "women", "unisex"].includes(
          normalizedGender
        )
      ) {
        return res.status(400).json({
          message:
            "Gender must be men, women or unisex.",
        });
      }

      filter.gender = normalizedGender;
    }

    // =================================================
    // FEATURED
    // =================================================

    const featuredValue =
      parseBoolean(featured);

    if (featuredValue !== undefined) {
      filter.isFeatured = featuredValue;
    }

    // =================================================
    // ACTIVE
    // =================================================
    //
    // IMPORTANT:
    //
    // Older Cartify products may not have isActive.
    //
    // Therefore public products should include:
    //
    // 1. isActive === true
    // 2. isActive field does not exist
    //
    // This prevents old products from disappearing.
    //
    // =================================================

    const activeValue =
      parseBoolean(active);

    if (activeValue !== undefined) {
      filter.isActive = activeValue;
    } else {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            {
              isActive: true,
            },
            {
              isActive: {
                $exists: false,
              },
            },
          ],
        },
      ];
    }

    // =================================================
    // FETCH
    // =================================================

    const products = await Product.find(filter)
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json(products);
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch products.",
    });
  }
};

// =====================================================
// GET SINGLE PRODUCT
// =====================================================

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message:
          "Invalid product ID.",
      });
    }

    // IMPORTANT:
    // Do NOT require isActive === true here.
    // This keeps older products accessible.
    const product =
      await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found.",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(
      "GET PRODUCT ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch product.",
    });
  }
};

// =====================================================
// CREATE PRODUCT
// =====================================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      gender,
      price,
      image,
      images,
      description,
      stock,
      sizes,
      colors,
      rating,
      numReviews,
      isFeatured,
      isActive,
    } = req.body;

    const cleanName =
      cleanString(name);

    const cleanBrand =
      cleanString(brand);

    const cleanCategory =
      cleanString(category);

    const cleanImage =
      cleanString(image);

    const cleanDescription =
      cleanString(description);

    if (
      !cleanName ||
      !cleanBrand ||
      !cleanCategory ||
      !cleanImage ||
      !cleanDescription
    ) {
      return res.status(400).json({
        message:
          "Name, brand, category, image and description are required.",
      });
    }

    // =================================================
    // PRICE
    // =================================================

    const numericPrice =
      Number(price);

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        message:
          "Price must be a valid non-negative number.",
      });
    }

    // =================================================
    // STOCK
    // =================================================

    const numericStock =
      stock === undefined ||
      stock === null ||
      stock === ""
        ? 0
        : Number(stock);

    if (
      !Number.isFinite(numericStock) ||
      numericStock < 0 ||
      !Number.isInteger(numericStock)
    ) {
      return res.status(400).json({
        message:
          "Stock must be a non-negative whole number.",
      });
    }

    // =================================================
    // GENDER
    // =================================================

    const normalizedGender =
      cleanString(
        gender || "unisex"
      ).toLowerCase();

    if (
      !["men", "women", "unisex"].includes(
        normalizedGender
      )
    ) {
      return res.status(400).json({
        message:
          "Gender must be men, women or unisex.",
      });
    }

    // =================================================
    // IMAGES
    // =================================================

    const normalizedImages =
      normalizeArray(images);

    const galleryImages =
      normalizedImages.filter(
        (item) =>
          item !== cleanImage
      );

    // =================================================
    // SIZES
    // =================================================

    const normalizedSizes =
      normalizeSizes(sizes);

    // =================================================
    // COLORS
    // =================================================

    const normalizedColors =
      normalizeColors(colors);

    // =================================================
    // RATING
    // =================================================

    let numericRating = 0;

    if (
      rating !== undefined &&
      rating !== null &&
      rating !== ""
    ) {
      numericRating = Number(rating);
    }

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 0 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message:
          "Rating must be between 0 and 5.",
      });
    }

    // =================================================
    // REVIEWS
    // =================================================

    let numericNumReviews = 0;

    if (
      numReviews !== undefined &&
      numReviews !== null &&
      numReviews !== ""
    ) {
      numericNumReviews =
        Number(numReviews);
    }

    if (
      !Number.isFinite(
        numericNumReviews
      ) ||
      numericNumReviews < 0 ||
      !Number.isInteger(
        numericNumReviews
      )
    ) {
      return res.status(400).json({
        message:
          "numReviews must be a non-negative whole number.",
      });
    }

    // =================================================
    // BOOLEAN FIELDS
    // =================================================

    const featuredValue =
      parseBoolean(isFeatured);

    const activeValue =
      parseBoolean(isActive);

    // =================================================
    // CREATE
    // =================================================

    const product =
      await Product.create({
        name: cleanName,
        brand: cleanBrand,
        category: cleanCategory,
        gender: normalizedGender,

        price: numericPrice,

        image: cleanImage,

        images: galleryImages,

        description: cleanDescription,

        stock: numericStock,

        sizes: normalizedSizes,

        colors: normalizedColors,

        rating: numericRating,

        numReviews:
          numericNumReviews,

        isFeatured:
          featuredValue ?? false,

        isActive:
          activeValue ?? true,
      });

    return res.status(201).json({
      message:
        "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR =>",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (item) => item.message
        );

      return res.status(400).json({
        message:
          messages.join(", "),
      });
    }

    return res.status(500).json({
      message:
        "Unable to create product.",
    });
  }
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message:
          "Invalid product ID.",
      });
    }

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found.",
      });
    }

    const {
      name,
      brand,
      category,
      gender,
      price,
      image,
      images,
      description,
      stock,
      sizes,
      colors,
      rating,
      numReviews,
      isFeatured,
      isActive,
    } = req.body;

    if (name !== undefined) {
      const value =
        cleanString(name);

      if (!value) {
        return res.status(400).json({
          message:
            "Product name cannot be empty.",
        });
      }

      product.name = value;
    }

    if (brand !== undefined) {
      const value =
        cleanString(brand);

      if (!value) {
        return res.status(400).json({
          message:
            "Brand cannot be empty.",
        });
      }

      product.brand = value;
    }

    if (category !== undefined) {
      const value =
        cleanString(category);

      if (!value) {
        return res.status(400).json({
          message:
            "Category cannot be empty.",
        });
      }

      product.category = value;
    }

    if (gender !== undefined) {
      const normalizedGender =
        cleanString(gender)
          .toLowerCase();

      if (
        !["men", "women", "unisex"].includes(
          normalizedGender
        )
      ) {
        return res.status(400).json({
          message:
            "Gender must be men, women or unisex.",
        });
      }

      product.gender =
        normalizedGender;
    }

    if (price !== undefined) {
      const numericPrice =
        Number(price);

      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          message:
            "Price must be a valid non-negative number.",
        });
      }

      product.price =
        numericPrice;
    }

    if (image !== undefined) {
      const value =
        cleanString(image);

      if (!value) {
        return res.status(400).json({
          message:
            "Main product image cannot be empty.",
        });
      }

      product.image = value;
    }

    if (images !== undefined) {
      const normalizedImages =
        normalizeArray(images);

      product.images =
        normalizedImages.filter(
          (item) =>
            item !== product.image
        );
    }

    if (description !== undefined) {
      const value =
        cleanString(description);

      if (!value) {
        return res.status(400).json({
          message:
            "Description cannot be empty.",
        });
      }

      product.description =
        value;
    }

    if (stock !== undefined) {
      const numericStock =
        Number(stock);

      if (
        !Number.isFinite(
          numericStock
        ) ||
        numericStock < 0 ||
        !Number.isInteger(
          numericStock
        )
      ) {
        return res.status(400).json({
          message:
            "Stock must be a non-negative whole number.",
        });
      }

      product.stock =
        numericStock;
    }

    if (sizes !== undefined) {
      product.sizes =
        normalizeSizes(sizes);
    }

    if (colors !== undefined) {
      product.colors =
        normalizeColors(colors);
    }

    if (rating !== undefined) {
      const numericRating =
        Number(rating);

      if (
        !Number.isFinite(
          numericRating
        ) ||
        numericRating < 0 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          message:
            "Rating must be between 0 and 5.",
        });
      }

      product.rating =
        numericRating;
    }

    if (numReviews !== undefined) {
      const numericNumReviews =
        Number(numReviews);

      if (
        !Number.isFinite(
          numericNumReviews
        ) ||
        numericNumReviews < 0 ||
        !Number.isInteger(
          numericNumReviews
        )
      ) {
        return res.status(400).json({
          message:
            "numReviews must be a non-negative whole number.",
        });
      }

      product.numReviews =
        numericNumReviews;
    }

    if (isFeatured !== undefined) {
      const featuredValue =
        parseBoolean(isFeatured);

      if (
        featuredValue ===
        undefined
      ) {
        return res.status(400).json({
          message:
            "isFeatured must be true or false.",
        });
      }

      product.isFeatured =
        featuredValue;
    }

    if (isActive !== undefined) {
      const activeValue =
        parseBoolean(isActive);

      if (
        activeValue ===
        undefined
      ) {
        return res.status(400).json({
          message:
            "isActive must be true or false.",
        });
      }

      product.isActive =
        activeValue;
    }

    const updatedProduct =
      await product.save();

    return res.status(200).json({
      message:
        "Product updated successfully.",
      product:
        updatedProduct,
    });
  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR =>",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (item) => item.message
        );

      return res.status(400).json({
        message:
          messages.join(", "),
      });
    }

    return res.status(500).json({
      message:
        "Unable to update product.",
    });
  }
};

// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message:
          "Invalid product ID.",
      });
    }

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message:
          "Product not found.",
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      message:
        "Product deleted successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete product.",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};