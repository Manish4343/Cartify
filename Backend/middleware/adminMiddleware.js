const admin = (req, res, next) => {
  try {
    const configuredAdminEmail = String(
      process.env.ADMIN_EMAIL || ""
    )
      .trim()
      .toLowerCase();

    if (!configuredAdminEmail) {
      return res.status(500).json({
        message:
          "ADMIN_EMAIL is not configured on the server.",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const loggedInEmail = String(
      req.user.email || ""
    )
      .trim()
      .toLowerCase();

    // =================================================
    // ONLY ONE ADMIN
    // =================================================

    if (
      req.user.isAdmin === true &&
      loggedInEmail === configuredAdminEmail
    ) {
      return next();
    }

    return res.status(403).json({
      message:
        "Admin access denied.",
    });
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

module.exports = admin;