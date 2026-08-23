require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

const allowedOrigins = String(
  process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / Postman requests
      if (!origin) {
        return callback(null, true);
      }

      // Development fallback
      if (
        process.env.NODE_ENV !==
          "production" &&
        allowedOrigins.length === 0
      ) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          "CORS origin not allowed."
        )
      );
    },
    credentials: true,
  })
);

app.use(
  express.json()
);

// =====================================================
// ROUTES
// =====================================================

app.use(
  "/api/payment",
  paymentRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use("/api/reviews", reviewRoutes);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Cartify Backend Running",
  });
});

// =====================================================
// CREATE / SYNC SINGLE ADMIN
// =====================================================

const ensureAdminUser = async () => {
  try {
    const adminEmail =
      String(
        process.env.ADMIN_EMAIL ||
          ""
      )
        .trim()
        .toLowerCase();

    const adminPassword =
      String(
        process.env.ADMIN_PASSWORD ||
          ""
      );

    const adminName =
      String(
        process.env.ADMIN_NAME ||
          "Cartify Admin"
      ).trim();

    if (
      !adminEmail ||
      !adminPassword
    ) {
      console.error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be configured."
      );

      return;
    }

    let adminUser =
      await User.findOne({
        email: adminEmail,
      });

    const hashedPassword =
      await bcrypt.hash(
        adminPassword,
        10
      );

    if (!adminUser) {
      adminUser =
        await User.create({
          name: adminName,
          email: adminEmail,
          password:
            hashedPassword,
          isAdmin: true,
        });

      console.log(
        "✅ Cartify admin account created:",
        adminEmail
      );

      return;
    }

    // Keep admin account as the only admin.
    adminUser.isAdmin = true;

    // Keep password synced with ADMIN_PASSWORD.
    adminUser.password =
      hashedPassword;

    if (!adminUser.name) {
      adminUser.name =
        adminName;
    }

    await adminUser.save();

    // Remove admin flag from every other account.
    await User.updateMany(
      {
        email: {
          $ne: adminEmail,
        },
        isAdmin: true,
      },
      {
        $set: {
          isAdmin: false,
        },
      }
    );

    console.log(
      "✅ Single Cartify admin verified:",
      adminEmail
    );
  } catch (error) {
    console.error(
      "ADMIN SETUP ERROR =>",
      error
    );
  }
};

// =====================================================
// DATABASE
// =====================================================

const startServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB Connected ✅"
    );

    console.log(
      "Database:",
      mongoose.connection.name
    );

    await ensureAdminUser();

    const PORT =
      process.env.PORT || 5000;

    app.listen(
      PORT,
      () => {
        console.log(
          `Cartify server running on port ${PORT} 🚀`
        );
      }
    );
  } catch (error) {
    console.error(
      "SERVER START ERROR =>",
      error
    );

    process.exit(1);
  }
};

startServer();