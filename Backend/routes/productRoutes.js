// const express = require("express");
// const Product = require("../models/Product");

// const router = express.Router();

// // GET ALL PRODUCTS
// router.get("/", async (req, res) => {
//   try {
//     const products = await Product.find().sort({ createdAt: -1 });

//     console.log("PRODUCTS FOUND:", products.length);

//     res.status(200).json(products);
//   } catch (error) {
//     console.error("GET PRODUCTS ERROR:", error);

//     res.status(500).json({
//       message: "Failed to fetch products",
//       error: error.message,
//     });
//   }
// });

// // GET SINGLE PRODUCT
// router.get("/:id", async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({
//         message: "Product not found",
//       });
//     }

//     res.status(200).json(product);
//   } catch (error) {
//     console.error("GET SINGLE PRODUCT ERROR:", error);

//     res.status(500).json({
//       message: "Failed to fetch product",
//       error: error.message,
//     });
//   }
// });

// // CREATE PRODUCT
// router.post("/", async (req, res) => {
//   try {
//     console.log("CREATE PRODUCT BODY:", req.body);

//     const {
//       name,
//       brand,
//       category,
//       price,
//       image,
//       description,
//       stock,
//     } = req.body;

//     if (
//       !name ||
//       !brand ||
//       !category ||
//       price === undefined ||
//       !image ||
//       !description
//     ) {
//       return res.status(400).json({
//         message: "All required product fields are missing",
//       });
//     }

//     const product = await Product.create({
//       name,
//       brand,
//       category,
//       price,
//       image,
//       description,
//       stock: stock || 0,
//     });

//     res.status(201).json(product);
//   } catch (error) {
//     console.error("CREATE PRODUCT ERROR:", error);

//     res.status(500).json({
//       message: error.message,
//     });
//   }
// });

// // UPDATE PRODUCT
// router.put("/:id", async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({
//         message: "Product not found",
//       });
//     }

//     product.name = req.body.name;
//     product.brand = req.body.brand;
//     product.category = req.body.category;
//     product.price = req.body.price;
//     product.image = req.body.image;
//     product.description = req.body.description;
//     product.stock = req.body.stock;

//     const updatedProduct = await product.save();

//     res.status(200).json(updatedProduct);
//   } catch (error) {
//     console.error("UPDATE PRODUCT ERROR:", error);

//     res.status(500).json({
//       message: error.message,
//     });
//   }
// });

// // DELETE PRODUCT
// router.delete("/:id", async (req, res) => {
//   try {
//     const product = await Product.findByIdAndDelete(req.params.id);

//     if (!product) {
//       return res.status(404).json({
//         message: "Product not found",
//       });
//     }

//     res.status(200).json({
//       message: "Product deleted successfully",
//     });
//   } catch (error) {
//     console.error("DELETE PRODUCT ERROR:", error);

//     res.status(500).json({
//       message: error.message,
//     });
//   }
// });

// module.exports = router;


const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// PUBLIC
// =====================================================

router.get("/", getProducts);

router.get("/:id", getProductById);

// =====================================================
// ADMIN ONLY
// =====================================================

router.post(
  "/",
  protect,
  admin,
  createProduct
);

router.put(
  "/:id",
  protect,
  admin,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteProduct
);

module.exports = router;