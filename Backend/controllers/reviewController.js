const Review = require("../models/Review");
const Product = require("../models/Product");

// ==========================================
// GET PRODUCT REVIEWS
// ==========================================

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch reviews",
    });
  }
};

// ==========================================
// CREATE REVIEW
// ==========================================

const createReview = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const productId = req.params.productId;

    if (!name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Name, rating and comment are required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const numericRating = Number(rating);

    if (
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const review = await Review.create({
      product: productId,
      name: name.trim(),
      rating: numericRating,
      comment: comment.trim(),
    });

    // Recalculate product rating
    const reviews = await Review.find({
      product: productId,
    });

    const totalRating = reviews.reduce(
      (sum, item) => sum + item.rating,
      0
    );

    const averageRating =
      reviews.length > 0
        ? totalRating / reviews.length
        : 0;

    product.rating = Number(
      averageRating.toFixed(1)
    );

    product.numReviews = reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to submit review",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE REVIEW
// ==========================================

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(
      req.params.reviewId
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const productId = review.product;

    await review.deleteOne();

    const reviews = await Review.find({
      product: productId,
    });

    const totalRating = reviews.reduce(
      (sum, item) => sum + item.rating,
      0
    );

    const averageRating =
      reviews.length > 0
        ? totalRating / reviews.length
        : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: Number(averageRating.toFixed(1)),
      numReviews: reviews.length,
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete review",
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
};