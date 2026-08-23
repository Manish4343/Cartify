const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =====================================================
// PROTECT
// =====================================================

const protect = async (
  req,
  res,
  next
) => {
  try {
    const authorization =
      req.headers.authorization || "";

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        message:
          "Not authorized. Please login.",
      });
    }

    const token =
      authorization
        .split(" ")[1]
        ?.trim();

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication token missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        message:
          "Authentication service is not configured.",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    if (!decoded?.id) {
      return res.status(401).json({
        message:
          "Invalid authentication token.",
      });
    }

    const user =
      await User.findById(
        decoded.id
      ).select(
        "-password"
      );

    if (!user) {
      return res.status(401).json({
        message:
          "User no longer exists.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "AUTH MIDDLEWARE ERROR =>",
      error
    );

    if (
      error?.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        message:
          "Session expired. Please login again.",
      });
    }

    return res.status(401).json({
      message:
        "Not authorized. Please login again.",
    });
  }
};

// =====================================================
// ADMIN
// =====================================================

const admin = (
  req,
  res,
  next
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Authentication required.",
      });
    }

    const configuredAdminEmail =
      String(
        process.env.ADMIN_EMAIL || ""
      )
        .trim()
        .toLowerCase();

    const userEmail =
      String(
        req.user.email || ""
      )
        .trim()
        .toLowerCase();

    if (
      !configuredAdminEmail
    ) {
      return res.status(500).json({
        message:
          "ADMIN_EMAIL is not configured on the server.",
      });
    }

    // Admin is ONLY the configured admin email.
    if (
      userEmail !==
      configuredAdminEmail
    ) {
      return res.status(403).json({
        message:
          "Admin access denied.",
      });
    }

    // Keep database flag consistent.
    if (
      req.user.isAdmin !== true
    ) {
      req.user.isAdmin = true;
    }

    next();
  } catch (error) {
    console.error(
      "ADMIN MIDDLEWARE ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to verify admin access.",
    });
  }
};

module.exports = {
  protect,
  admin,
};