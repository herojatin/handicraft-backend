import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==================== ADMIN LOGIN ====================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    // Check admin exists
    const admin = await Admin.findOne({ email });

    console.log("ADMIN FOUND:", admin);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials - admin not found",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials - password mismatch",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Success response
    res.status(200).json({
      success: true,
      message: "Login success",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};