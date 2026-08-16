import Dealer from "../models/dealerModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  sendAdminNotification,
  sendApprovalEmail,
  sendRejectionEmail,
} from "../services/emailService.js";

// ===============================
// REGISTER DEALER
// ===============================

export const registerDealer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      companyName,
      country,
      state,
      city,
      address,
      password,
    } = req.body;

    console.log("Request Body:", req.body);

    // Check if email already exists and is not deleted
    const existingDealer = await Dealer.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    });

    console.log("Existing Dealer:", existingDealer);

    if (existingDealer) {
      return res.status(400).json({
        success: false,
        message: "Dealer already registered with this email.",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Dealer
    const dealer = await Dealer.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      mobile,
      companyName,
      country,
      state,
      city,
      address,
      password: hashedPassword,
      status: "Pending",
      accessType: "Inactive",
      isDeleted: false,
    });

    // Send Email to Admin
    await sendAdminNotification(dealer);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Waiting for admin approval.",
      dealer,
    });

  } catch (error) {
    console.error("Dealer Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// DEALER LOGIN
// ===============================

export const loginDealer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const dealer = await Dealer.findOne({
      email,
      isDeleted: false,
    });

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found.",
      });
    }

    if (dealer.status === "Pending") {
      return res.status(403).json({
        success: false,
        message: "Your account is awaiting admin approval.",
      });
    }

    if (dealer.status === "Inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    // Check 7-Day Expiry
    if (
      dealer.accessType === "7 Days" &&
      dealer.expiryDate &&
      new Date() > dealer.expiryDate
    ) {
      dealer.status = "Inactive";
      await dealer.save();

      return res.status(403).json({
        success: false,
        message: "Your access has expired.",
      });
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, dealer.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // JWT Token
    const token = jwt.sign(
      { id: dealer._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      dealer,
    });
  } catch (error) {
    console.error("Dealer Login Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET ALL DEALERS
// ===============================

export const getAllDealers = async (req, res) => {
  try {
    const dealers = await Dealer.find({
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      dealers,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// UPDATE DEALER ACCESS
// ===============================

export const updateDealerAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { accessType } = req.body;

    const dealer = await Dealer.findById(id);

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found.",
      });
    }

    switch (accessType) {
      case "Lifetime":
        dealer.status = "Active";
        dealer.accessType = "Lifetime";
        dealer.expiryDate = null;
        await dealer.save();
        await sendApprovalEmail(dealer);
        break;

      case "7 Days":
        dealer.status = "Active";
        dealer.accessType = "7 Days";

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);

        dealer.expiryDate = expiry;

        await dealer.save();
        await sendApprovalEmail(dealer);
        break;

      case "Inactive":
        dealer.status = "Inactive";
        dealer.accessType = "Inactive";
        dealer.expiryDate = null;

        await dealer.save();
        await sendRejectionEmail(dealer);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid access type.",
        });
    }

    return res.status(200).json({
      success: true,
      message: "Dealer access updated successfully.",
      dealer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// DELETE DEALER
// ===============================

export const deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;

    const dealer = await Dealer.findById(id);

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found.",
      });
    }

    dealer.isDeleted = true;
    await dealer.save();

    return res.status(200).json({
      success: true,
      message: "Dealer deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};