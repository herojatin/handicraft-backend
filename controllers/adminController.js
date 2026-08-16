import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

export const createAdmin = async (req, res) => {
  try {
    const { email, password, role, isActive } = req.body;

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
        email,
        password: hashedPassword,
        role,
        isActive,
      });

    res.status(201).json({
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    res.status(200).json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};