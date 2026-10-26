import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// ===============================
// Protect Admin
// ===============================

export const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("===== ADMIN AUTH DEBUG =====");
    console.log("Authorization Header:", authHeader ? "Token received" : "NO TOKEN");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("Token received:", !!token);
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Decoded Token:", decoded);

    req.admin = await Admin.findById(
      decoded.id
    ).select("-password");

    console.log(
      "Admin found:",
      req.admin ? req.admin.email : "NO ADMIN"
    );

    if (!req.admin) {
      console.log("❌ Admin not found for ID:", decoded.id);

      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    console.log("✅ Admin authentication successful");
    console.log("============================");

    next();

  } catch (error) {
    console.error("❌ JWT Error:", error.message);

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