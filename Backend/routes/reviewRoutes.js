const express = require("express");

const {
  getProductReviews,
  createReview,
  deleteReview,
} = require("../controllers/reviewController");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// PUBLIC
// =====================================================

// Get product reviews
router.get(
  "/product/:productId",
  getProductReviews
);

// =====================================================
// AUTHENTICATED USER
// =====================================================

// Create review
router.post(
  "/product/:productId",
  protect,
  createReview
);

// =====================================================
// ADMIN ONLY
// =====================================================

// Delete review
router.delete(
  "/:reviewId",
  protect,
  admin,
  deleteReview
);

module.exports = router;