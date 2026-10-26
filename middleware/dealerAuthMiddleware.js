import jwt from "jsonwebtoken";
import Dealer from "../models/dealerModel.js";

export const protectDealer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Dealer login required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Dealer token is missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /*
     * Different login implementations may store
     * the dealer ID under different names.
     */
    const dealerId =
      decoded.id ||
      decoded._id ||
      decoded.dealerId ||
      decoded.userId;

    const dealerEmail =
      decoded.email ||
      decoded.dealerEmail;

    let dealer = null;

    // ------------------------------------------
    // Find dealer by ID
    // ------------------------------------------

    if (dealerId) {
      dealer = await Dealer.findById(dealerId);
    }

    // ------------------------------------------
    // Fallback: find dealer by email
    // ------------------------------------------

    if (!dealer && dealerEmail) {
      dealer = await Dealer.findOne({
        email: String(dealerEmail)
          .trim()
          .toLowerCase(),
      });
    }

    if (!dealer) {
      return res.status(401).json({
        success: false,
        message:
          "Dealer account not found. Please login again.",
      });
    }

    // ------------------------------------------
    // Check dealer status
    // ------------------------------------------

    if (dealer.status !== "Active") {
      return res.status(403).json({
        success: false,
        message:
          "Your dealer account is not active.",
      });
    }

    // ------------------------------------------
    // Attach dealer to request
    // ------------------------------------------

    req.dealer = dealer;

    next();
  } catch (error) {
    console.error(
      "DEALER JWT ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired dealer token. Please login again.",
    });
  }
};