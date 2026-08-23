// const express = require('express');
// const Razorpay = require('razorpay');

// console.log('KEY ID =>', process.env.RAZORPAY_KEY_ID);
// console.log('KEY SECRET =>', process.env.RAZORPAY_KEY_SECRET);

// const router = express.Router();

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// router.post('/create-order', async (req, res) => {
//   try {
//     const { amount } = req.body;

//     const options = {
//       amount: amount * 100,
//       currency: 'INR',
//       receipt: 'receipt_' + Date.now(),
//     };

//     const order = await razorpay.orders.create(options);

//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// module.exports = router;

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();

// =====================================================
// RAZORPAY
// =====================================================

const getRazorpay = () => {
  const keyId =
    process.env.RAZORPAY_KEY_ID;

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// =====================================================
// CREATE RAZORPAY ORDER
// POST /api/payment/create-order
// =====================================================

router.post(
  "/create-order",
  async (req, res) => {
    try {
      const amount = Number(
        req.body?.amount
      );

      // -----------------------------
      // VALIDATE AMOUNT
      // -----------------------------

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid payment amount is required.",
        });
      }

      // Avoid unreasonable values
      if (amount > 10000000) {
        return res.status(400).json({
          success: false,
          message:
            "Payment amount is too large.",
        });
      }

      const razorpay =
        getRazorpay();

      const options = {
        amount:
          Math.round(amount * 100),
        currency: "INR",
        receipt:
          `cartify_${Date.now()}`,
      };

      const order =
        await razorpay.orders.create(
          options
        );

      return res.status(201).json({
        success: true,
        ...order,
      });
    } catch (error) {
      console.error(
        "RAZORPAY CREATE ORDER ERROR =>",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create payment order.",
      });
    }
  }
);

// =====================================================
// VERIFY PAYMENT
// POST /api/payment/verify-payment
// =====================================================

router.post(
  "/verify-payment",
  (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body || {};

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Incomplete payment verification data.",
        });
      }

      const secret =
        process.env
          .RAZORPAY_KEY_SECRET;

      if (!secret) {
        return res.status(500).json({
          success: false,
          message:
            "Payment gateway is not configured.",
        });
      }

      const body =
        `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            secret
          )
          .update(body)
          .digest("hex");

      const isValid =
        crypto.timingSafeEqual(
          Buffer.from(
            expectedSignature
          ),
          Buffer.from(
            String(
              razorpay_signature
            )
          )
        );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment signature.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Payment verified successfully.",
      });
    } catch (error) {
      console.error(
        "PAYMENT VERIFICATION ERROR =>",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          "Payment verification failed.",
      });
    }
  }
);

module.exports = router;