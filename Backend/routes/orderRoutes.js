const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Product = require("../models/Product");

const {
  protect,
} = require("../middleware/authMiddleware");

const admin = require("../middleware/adminMiddleware");

const router = express.Router();

const allowedStatuses = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

// =====================================================
// CREATE ORDER
// POST /api/orders
// PAYMENT VERIFIED + STOCK UPDATE
// =====================================================

router.post("/", protect, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      items,
      paymentId,
      razorpayOrderId,
      paymentSignature,
      paymentStatus,
      orderStatus,
      address,
    } = req.body || {};

    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one product.",
      });
    }

    if (
      !address?.name ||
      !address?.phone ||
      !address?.address ||
      !address?.city ||
      !address?.state ||
      !address?.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address is required.",
      });
    }

    if (
      !paymentId ||
      !razorpayOrderId ||
      !paymentSignature ||
      paymentStatus !== "Paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "Verified paid payment is required.",
      });
    }

    // =================================================
    // PREVENT DUPLICATE PAYMENT
    // =================================================

    const existingOrder = await Order.findOne({
      $or: [
        {
          paymentId: String(paymentId),
        },
        {
          razorpayOrderId: String(razorpayOrderId),
        },
      ],
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "This payment has already been used for an order.",
        order: existingOrder,
        _id: existingOrder._id,
      });
    }

    // =================================================
    // VALIDATE ITEMS
    // =================================================

    const requestedItems = items.map((item) => ({
      product: item?.product,
      quantity: Number(item?.quantity),
    }));

    for (const item of requestedItems) {
      if (
        !item.product ||
        !mongoose.Types.ObjectId.isValid(item.product)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID in order.",
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Product quantity must be at least 1.",
        });
      }
    }

    // =================================================
    // VERIFY RAZORPAY SIGNATURE
    // =================================================

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== paymentSignature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature is invalid.",
      });
    }

    // =================================================
    // VERIFY RAZORPAY ORDER
    // =================================================

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.fetch(
      razorpayOrderId
    );

    if (!razorpayOrder || !razorpayOrder.id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order could not be verified.",
      });
    }

    if (razorpayOrder.currency !== "INR") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment currency.",
      });
    }

    // =================================================
    // COMBINE DUPLICATE PRODUCT IDS
    // =================================================

    const quantities = new Map();

    for (const item of requestedItems) {
      const productId = String(item.product);

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + item.quantity
      );
    }

    let createdOrder = null;
    let calculatedTotal = 0;

    // =================================================
    // DATABASE TRANSACTION
    // =================================================

    await session.withTransaction(async () => {
      const productMap = new Map();

      // =================================================
      // GET CURRENT DATABASE PRODUCTS
      // =================================================

      for (const [
        productId,
        quantity,
      ] of quantities.entries()) {
        const product = await Product.findById(
          productId
        ).session(session);

        if (!product) {
          throw new Error(
            `Product not found: ${productId}`
          );
        }

        // =================================================
        // CHECK STOCK
        // =================================================

        if (Number(product.stock) < quantity) {
          throw new Error(
            `Only ${product.stock} item${
              product.stock === 1 ? "" : "s"
            } available for ${product.name}.`
          );
        }

        productMap.set(productId, product);

        calculatedTotal +=
          Number(product.price) * quantity;
      }

      // =================================================
      // VERIFY PAYMENT AMOUNT
      // =================================================

      const razorpayAmount = Number(
        razorpayOrder.amount
      );

      const expectedAmount = Math.round(
        calculatedTotal * 100
      );

      if (razorpayAmount !== expectedAmount) {
        throw new Error(
          "Payment amount does not match the current product total."
        );
      }

      // =================================================
      // DECREASE STOCK
      // =================================================

      for (const [
        productId,
        quantity,
      ] of quantities.entries()) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: productId,
              stock: {
                $gte: quantity,
              },
            },
            {
              $inc: {
                stock: -quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!updatedProduct) {
          throw new Error(
            "Stock changed while placing the order. Please try again."
          );
        }
      }

      // =================================================
      // CREATE ORDER ITEMS
      // =================================================

      const orderItems = requestedItems.map(
        (item) => {
          const product = productMap.get(
            String(item.product)
          );

          return {
            product: product._id,
            name: product.name,
            image: product.image || "",
            price: Number(product.price),
            quantity: item.quantity,
          };
        }
      );

      // =================================================
      // CREATE ORDER
      // =================================================

      const created = await Order.create(
        [
          {
            user: req.user._id,

            items: orderItems,

            totalAmount: calculatedTotal,

            paymentId: String(paymentId),

            razorpayOrderId: String(
              razorpayOrderId
            ),

            paymentStatus: "Paid",

            orderStatus:
              allowedStatuses.includes(
                orderStatus
              )
                ? orderStatus
                : "Processing",

            address: {
              name: String(
                address.name
              ).trim(),

              phone: String(
                address.phone
              ).trim(),

              address: String(
                address.address
              ).trim(),

              city: String(
                address.city
              ).trim(),

              state: String(
                address.state
              ).trim(),

              pincode: String(
                address.pincode
              ).trim(),
            },
          },
        ],
        {
          session,
        }
      );

      createdOrder = created[0];
    });

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "Order created successfully and stock updated.",

      order: createdOrder,

      _id: createdOrder._id,

      totalAmount: calculatedTotal,
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR =>",
      error
    );

    // =================================================
    // STOCK / PRODUCT FAILURE
    // =================================================

    if (
      error.message?.startsWith("Only ") ||
      error.message?.startsWith(
        "Product not found"
      ) ||
      error.message?.startsWith(
        "Stock changed"
      )
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    // =================================================
    // DUPLICATE PAYMENT
    // =================================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This payment has already been processed.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create order.",
    });
  } finally {
    await session.endSession();
  }
});

// =====================================================
// USER - GET MY ORDERS
// IMPORTANT:
// This MUST come before /:id
//
// GET /api/orders/my-orders
// =====================================================

router.get(
  "/my-orders",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user?._id ||
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      const orders =
        await Order.find({
          user: userId,
        })
          .populate(
            "items.product",
            "name brand category price image stock"
          )
          .sort({
            createdAt: -1,
          });

      // Orders.jsx already supports both:
      // array response
      // and { orders: [] }
      //
      // Returning array keeps compatibility
      // with the existing frontend.

      return res.status(200).json(
        orders
      );
    } catch (error) {
      console.error(
        "GET MY ORDERS ERROR =>",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load orders.",
      });
    }
  }
);

// =====================================================
// ADMIN - GET ALL ORDERS
// GET /api/orders/admin/all
// =====================================================

router.get(
  "/admin/all",
  protect,
  admin,
  async (req, res) => {
    try {
      const orders =
        await Order.find({})
          .populate(
            "user",
            "name email"
          )
          .populate(
            "items.product",
            "name brand image price stock"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error(
        "ADMIN GET ORDERS ERROR =>",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load orders.",
      });
    }
  }
);

// =====================================================
// ADMIN - UPDATE ORDER STATUS
// PUT /api/orders/admin/:id/status
// =====================================================

router.put(
  "/admin/:id/status",
  protect,
  admin,
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      const {
        id,
      } = req.params;

      const {
        orderStatus,
      } = req.body || {};

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID.",
        });
      }

      if (
        !allowedStatuses.includes(
          orderStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status.",
        });
      }

      let responseOrder = null;

      await session.withTransaction(
        async () => {
          const order =
            await Order.findById(
              id
            ).session(session);

          if (!order) {
            throw new Error(
              "ORDER_NOT_FOUND"
            );
          }

          const previousStatus =
            order.orderStatus;

          // =================================================
          // CANCEL ORDER -> RETURN STOCK
          // =================================================

          if (
            previousStatus !==
              "Cancelled" &&
            orderStatus ===
              "Cancelled"
          ) {
            for (
              const item of order.items
            ) {
              await Product.findByIdAndUpdate(
                item.product,
                {
                  $inc: {
                    stock:
                      Number(
                        item.quantity
                      ),
                  },
                },
                {
                  session,
                }
              );
            }
          }

          // =================================================
          // REOPEN CANCELLED ORDER -> REMOVE STOCK
          // =================================================

          if (
            previousStatus ===
              "Cancelled" &&
            orderStatus !==
              "Cancelled"
          ) {
            for (
              const item of order.items
            ) {
              const updated =
                await Product.findOneAndUpdate(
                  {
                    _id:
                      item.product,

                    stock: {
                      $gte:
                        Number(
                          item.quantity
                        ),
                    },
                  },
                  {
                    $inc: {
                      stock:
                        -Number(
                          item.quantity
                        ),
                    },
                  },
                  {
                    new: true,
                    session,
                  }
                );

              if (!updated) {
                throw new Error(
                  `Not enough stock to reopen ${item.name}.`
                );
              }
            }
          }

          // =================================================
          // UPDATE STATUS
          // =================================================

          order.orderStatus =
            orderStatus;

          await order.save({
            session,
          });

          responseOrder =
            await Order.findById(
              id
            )
              .populate(
                "user",
                "name email"
              )
              .populate(
                "items.product",
                "name brand image price stock"
              )
              .session(
                session
              );
        }
      );

      return res.json({
        success: true,

        message:
          "Order status updated successfully.",

        order:
          responseOrder,
      });
    } catch (error) {
      console.error(
        "UPDATE ORDER STATUS ERROR =>",
        error
      );

      if (
        error.message ===
        "ORDER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      if (
        error.message?.startsWith(
          "Not enough stock"
        )
      ) {
        return res.status(409).json({
          success: false,
          message:
            error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update order status.",
      });
    } finally {
      await session.endSession();
    }
  }
);

// =====================================================
// USER - GET OWN ORDERS BY USER ID
// GET /api/orders/user/:userId
// =====================================================

router.get(
  "/user/:userId",
  protect,
  async (req, res) => {
    try {
      const {
        userId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      if (
        String(
          req.user._id
        ) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only view your own orders.",
        });
      }

      const orders =
        await Order.find({
          user: userId,
        })
          .populate(
            "items.product"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "GET USER ORDERS ERROR =>",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load orders.",
      });
    }
  }
);

// =====================================================
// USER / ADMIN - GET SINGLE ORDER
// GET /api/orders/:id
//
// IMPORTANT:
// Keep this AFTER /my-orders,
// /admin/all,
// /admin/:id/status,
// /user/:userId
// =====================================================

router.get(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      // =================================================
      // VALIDATE ORDER ID
      // =================================================

      if (
        !id ||
        id === "undefined" ||
        id === "null" ||
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order ID.",
        });
      }

      // =================================================
      // FIND ORDER
      // =================================================

      const order =
        await Order.findById(
          id
        )
          .populate(
            "user",
            "name email isAdmin"
          )
          .populate(
            "items.product",
            "name brand category price image stock"
          );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      // =================================================
      // CHECK OWNER / ADMIN
      // =================================================

      const currentUserId =
        req.user?._id ||
        req.user?.id;

      const isOwner =
        String(
          order.user?._id
        ) ===
        String(
          currentUserId
        );

      const isAdmin =
        req.user?.isAdmin === true;

      if (
        !isOwner &&
        !isAdmin
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this order.",
        });
      }

      // =================================================
      // SUCCESS
      // =================================================

      return res.status(200).json({
        success: true,
        order,
        _id: order._id,
      });
    } catch (error) {
      console.error(
        "GET SINGLE ORDER ERROR =>",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load order.",
      });
    }
  }
);

module.exports = router;