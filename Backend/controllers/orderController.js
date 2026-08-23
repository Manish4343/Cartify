const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const {
      items,
      address,
      paymentId,
      razorpayOrderId,
      paymentStatus,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order items are required.",
      });
    }

    if (!address) {
      return res.status(400).json({
        message: "Delivery address is required.",
      });
    }

    const requiredAddressFields = [
      "name",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    for (const field of requiredAddressFields) {
      if (
        !address[field] ||
        String(address[field]).trim() === ""
      ) {
        return res.status(400).json({
          message: `${field} is required.`,
        });
      }
    }

    // =================================================
    // COMBINE DUPLICATE PRODUCTS
    // =================================================

    const productQuantities = new Map();

    for (const item of items) {
      if (!item?.product) {
        return res.status(400).json({
          message: "Product ID is missing.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          item.product
        )
      ) {
        return res.status(400).json({
          message: `Invalid product ID: ${item.product}`,
        });
      }

      const quantity = Number(
        item.quantity || item.qty || 1
      );

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid product quantity.",
        });
      }

      const productId =
        item.product.toString();

      const previousQuantity =
        productQuantities.get(productId) || 0;

      productQuantities.set(
        productId,
        previousQuantity + quantity
      );
    }

    // =================================================
    // START TRANSACTION
    // =================================================

    session.startTransaction();

    const orderItems = [];

    // =================================================
    // CHECK STOCK + DECREASE STOCK
    // =================================================

    for (const [
      productId,
      quantity,
    ] of productQuantities.entries()) {
      const product =
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

      if (!product) {
        const existingProduct =
          await Product.findById(
            productId
          ).session(session);

        if (!existingProduct) {
          throw new Error(
            `Product not found: ${productId}`
          );
        }

        throw new Error(
          `${existingProduct.name} has only ${existingProduct.stock} item(s) left in stock.`
        );
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
      });
    }

    // =================================================
    // CALCULATE TOTAL
    // =================================================

    const calculatedTotal =
      orderItems.reduce(
        (total, item) => {
          return (
            total +
            Number(item.price) *
              Number(item.quantity)
          );
        },
        0
      );

    // =================================================
    // CREATE ORDER
    // =================================================

    const orderData = {
      user: userId,

      items: orderItems,

      totalAmount: calculatedTotal,

      paymentStatus:
        paymentStatus || "Pending",

      orderStatus: "Processing",

      address: {
        name: String(address.name).trim(),
        phone: String(address.phone).trim(),
        address: String(address.address).trim(),
        city: String(address.city).trim(),
        state: String(address.state).trim(),
        pincode: String(address.pincode).trim(),
      },
    };

    // Only save payment fields when provided.
    // This keeps the current test-payment flow safe.

    if (paymentId) {
      orderData.paymentId = paymentId;
    }

    if (razorpayOrderId) {
      orderData.razorpayOrderId =
        razorpayOrderId;
    }

    const createdOrders =
      await Order.create(
        [orderData],
        {
          session,
        }
      );

    const order = createdOrders[0];

    // =================================================
    // COMMIT TRANSACTION
    // =================================================

    await session.commitTransaction();

    // =================================================
    // POPULATE ORDER
    // =================================================

    const populatedOrder =
      await Order.findById(
        order._id
      )
        .populate(
          "user",
          "name email isAdmin"
        )
        .populate(
          "items.product",
          "name brand category price image stock"
        );

    return res.status(201).json(
      populatedOrder
    );
  } catch (error) {
    // =================================================
    // ROLLBACK
    // =================================================

    try {
      if (
        session.inTransaction()
      ) {
        await session.abortTransaction();
      }
    } catch (rollbackError) {
      console.error(
        "ORDER ROLLBACK ERROR =>",
        rollbackError
      );
    }

    console.error(
      "CREATE ORDER ERROR =>",
      error
    );

    const message =
      error?.message ||
      "Unable to create order.";

    if (
      message.includes(
        "has only"
      ) ||
      message.includes(
        "Product not found"
      )
    ) {
      return res.status(400).json({
        message,
      });
    }

    return res.status(500).json({
      message:
        "Unable to create order.",
    });
  } finally {
    await session.endSession();
  }
};

// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required.",
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

    return res.status(200).json(
      orders
    );
  } catch (error) {
    console.error(
      "GET MY ORDERS ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch orders.",
    });
  }
};

// =====================================================
// GET ALL ORDERS - ADMIN
// =====================================================

const getAllOrders = async (
  req,
  res
) => {
  try {
    if (
      req.user?.isAdmin !== true
    ) {
      return res.status(403).json({
        message:
          "Admin access required.",
      });
    }

    const orders =
      await Order.find()
        .populate(
          "user",
          "name email isAdmin"
        )
        .populate(
          "items.product",
          "name brand category price image stock"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      orders
    );
  } catch (error) {
    console.error(
      "GET ALL ORDERS ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch orders.",
    });
  }
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getOrderById = async (
  req,
  res
) => {
  try {
    const orderId =
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid order ID.",
      });
    }

    const order =
      await Order.findById(
        orderId
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
        message:
          "Order not found.",
      });
    }

    const userId =
      req.user?._id ||
      req.user?.id;

    const isOwner =
      order.user?._id?.toString() ===
      userId?.toString();

    const isAdmin =
      req.user?.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "You are not allowed to view this order.",
      });
    }

    return res.status(200).json(
      order
    );
  } catch (error) {
    console.error(
      "GET ORDER ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch order.",
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS - ADMIN
// =====================================================

const updateOrderStatus = async (
  req,
  res
) => {
  const session = await mongoose.startSession();

  try {
    if (
      req.user?.isAdmin !== true
    ) {
      return res.status(403).json({
        message:
          "Admin access required.",
      });
    }

    const orderId =
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid order ID.",
      });
    }

    const {
      orderStatus,
    } = req.body;

    const allowedStatuses = [
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(
        orderStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid order status.",
      });
    }

    session.startTransaction();

    const order =
      await Order.findById(
        orderId
      ).session(session);

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({
        message:
          "Order not found.",
      });
    }

    // =================================================
    // PREVENT REOPENING CANCELLED ORDER
    // =================================================

    if (
      order.orderStatus ===
        "Cancelled" &&
      orderStatus !==
        "Cancelled"
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "A cancelled order cannot be reopened.",
      });
    }

    // =================================================
    // CANCEL ORDER
    // =================================================

    if (
      orderStatus ===
        "Cancelled" &&
      order.orderStatus !==
        "Cancelled"
    ) {
      for (const item of order.items) {
        if (
          !mongoose.Types.ObjectId.isValid(
            item.product
          )
        ) {
          throw new Error(
            `Invalid product ID in order: ${item.product}`
          );
        }

        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: Number(
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

    order.orderStatus =
      orderStatus;

    await order.save({
      session,
    });

    await session.commitTransaction();

    // =================================================
    // POPULATE UPDATED ORDER
    // =================================================

    const updatedOrder =
      await Order.findById(
        order._id
      )
        .populate(
          "user",
          "name email isAdmin"
        )
        .populate(
          "items.product",
          "name brand category price image stock"
        );

    return res.status(200).json(
      updatedOrder
    );
  } catch (error) {
    try {
      if (
        session.inTransaction()
      ) {
        await session.abortTransaction();
      }
    } catch (rollbackError) {
      console.error(
        "STATUS ROLLBACK ERROR =>",
        rollbackError
      );
    }

    console.error(
      "UPDATE ORDER STATUS ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Unable to update order status.",
    });
  } finally {
    await session.endSession();
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};