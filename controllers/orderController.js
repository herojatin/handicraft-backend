import mongoose from "mongoose";
import crypto from "crypto";
import Order from "../models/order.js";
import Dealer from "../models/dealerModel.js";

// Helper for string sanitization
const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : "");

// ==========================================
// CREATE ORDER - DEALER
// ==========================================
export const createOrder = async (req, res) => {
  try {
    const { cart, dealerEmail } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    if (!dealerEmail) {
      return res.status(400).json({ success: false, message: "Dealer email is required." });
    }

    const dealer = await Dealer.findOne({ email: dealerEmail.trim().toLowerCase() });
    if (!dealer) {
      return res.status(404).json({ success: false, message: "Dealer not found." });
    }

    // Always guarantee a non-null, unique string ID BEFORE instantiate
    const generatedOrderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalQuantity = cart.reduce((total, item) => total + Number(item.quantity || 1), 0);

    const items = cart.map((item) => ({
      productId: item._id || item.id,
      productCode: item.productCode || "",
      productName: item.name || item.productName || item.description || "Product",
      quantity: Number(item.quantity || 1),
      image: Array.isArray(item.images) ? item.images[0] : (item.image || ""),
      category: item.category || "",
      subCategory: item.subCategory || "",
      comment: item.comment || "",
    }));

    const order = new Order({
      orderId: generatedOrderId, // Mandatory string
      dealer: dealer._id,
      dealerEmail: dealer.email.toLowerCase(),
      items,
      totalQuantity,
      status: "Pending",
    });

    const savedOrder = await order.save();
    return res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ==========================================
// GET DEALER ORDERS (Full Match Guarantee)
// ==========================================
export const getDealerOrders = async (req, res) => {
  try {
    const { dealerEmail } = req.params;

    if (!dealerEmail) {
      return res.status(400).json({
        success: false,
        message: "Dealer email is required.",
      });
    }

    const cleanEmail = decodeURIComponent(dealerEmail).trim().toLowerCase();

    // 1. Find dealer document first
    const dealer = await Dealer.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });

    // 2. Build multi-field search conditions
    const searchConditions = [
      { dealerEmail: { $regex: new RegExp(cleanEmail, "i") } },
    ];

    if (dealer) {
      searchConditions.push({ dealer: dealer._id });
    }

    // 3. Query orders
    const orders = await Order.find({
      $or: searchConditions,
    }).sort({ createdAt: -1 });

    console.log(`[GET ORDERS SUCCESS] Found ${orders.length} orders for ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET DEALER ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL ORDERS - ADMIN
// ==========================================
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("dealer", "firstName lastName email companyName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET SINGLE ORDER
// ==========================================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Order ID structure." });
    }

    const order = await Order.findById(id).populate(
      "dealer",
      "firstName lastName email companyName"
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("GET ORDER BY ID ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// UPDATE ORDER STATUS - ADMIN
// ==========================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Processing", "Completed", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status." });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};