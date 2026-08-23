const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================================================
// ADMIN EMAIL
// =====================================================

const getAdminEmail = () => {
  return String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
};

// =====================================================
// GENERATE JWT
// =====================================================

const generateToken = (id) => {
  return jwt.sign(
    {
      id: String(id),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// SIGNUP
// =====================================================

const signup = async (req, res) => {
  try {
    const name = String(
      req.body?.name || ""
    ).trim();

    const email = String(
      req.body?.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body?.password || ""
    );

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        message:
          "Name must contain at least 2 characters.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    // -----------------------------
    // EMAIL VALIDATION
    // -----------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email.",
      });
    }

    const adminEmail = getAdminEmail();

    // -----------------------------
    // ADMIN EMAIL RESERVED
    // -----------------------------

    if (
      adminEmail &&
      email === adminEmail
    ) {
      return res.status(403).json({
        message:
          "This email is reserved for the Cartify administrator.",
      });
    }

    // -----------------------------
    // EXISTING USER
    // -----------------------------

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });
    }

    // -----------------------------
    // HASH PASSWORD
    // -----------------------------

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // -----------------------------
    // CREATE USER
    // -----------------------------

    const user =
      await User.create({
        name,
        email,
        password: hashedPassword,
        isAdmin: false,
      });

    // -----------------------------
    // TOKEN
    // -----------------------------

    const token =
      generateToken(user._id);

    return res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: false,
      token,
    });
  } catch (error) {
    console.error(
      "SIGNUP ERROR =>",
      error
    );

    // Mongo duplicate email safety
    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message:
        "Unable to create account.",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const email = String(
      req.body?.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body?.password || ""
    );

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    // -----------------------------
    // FIND USER
    // -----------------------------

    const user =
      await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    // -----------------------------
    // PASSWORD
    // -----------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    // =================================================
    // IMPORTANT:
    // ADMIN IS DETERMINED ONLY BY ADMIN_EMAIL
    // =================================================

    const adminEmail =
      getAdminEmail();

    const isAdmin =
      Boolean(
        adminEmail &&
        email === adminEmail
      );

    // -----------------------------
    // SYNC ADMIN FLAG
    // -----------------------------

    if (
      user.isAdmin !== isAdmin
    ) {
      user.isAdmin = isAdmin;
      await user.save();
    }

    // -----------------------------
    // TOKEN
    // -----------------------------

    const token =
      generateToken(user._id);

    return res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin,
      token,
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR =>",
      error
    );

    return res.status(500).json({
      message:
        "Unable to login.",
    });
  }
};

module.exports = {
  signup,
  login,
};