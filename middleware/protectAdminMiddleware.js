import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// ===============================
// Protect Admin
// ===============================

export const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.admin = await Admin.findById(
      decoded.id
    ).select("-password");

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    next();

  } catch (error) {

    console.error(
      "JWT Error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ===============================
// Authorize Roles
// ===============================

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !roles.includes(
        req.admin.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action.",
      });
    }

    next();
  };
};