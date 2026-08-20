import mongoose from "mongoose";
import Order from "../models/order.js";
import Dealer from "../models/dealerModel.js";

// ==========================================
// CREATE ORDER - DEALER
// ==========================================
export const createOrder = async (req, res) => {
  try {
    console.log("========== CREATE ORDER ==========");
    console.log("Request body:", req.body);

    const { cart, dealerEmail } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    if (!dealerEmail) {
      return res.status(400).json({
        success: false,
        message: "Dealer email is required.",
      });
    }

    console.log("Searching dealer:", dealerEmail);

    const dealer = await Dealer.findOne({
      email: dealerEmail,
    });

    console.log("Dealer found:", dealer?._id);

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found.",
      });
    }

    // Calculate total quantity
    const totalQuantity = cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 1),
      0
    );

    // Generate order ID
    const orderId = new mongoose.Types.ObjectId()
      .toString()
      .substring(0, 13);

    // Prepare order items
    const items = cart.map((item) => {
      const productId = item._id || item.id;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(
          `Invalid product ID: ${productId}`
        );
      }

      let image = "";

      if (Array.isArray(item.images)) {
        image = item.images[0] || "";
      } else if (item.image) {
        image = item.image;
      }

      return {
        productId,
        productCode: item.productCode || "",
        productName:
          item.name ||
          item.productName ||
          item.description ||
          "Product",
        quantity: Number(item.quantity || 1),
        image,
        category: item.category || "",
        subCategory: item.subCategory || "",
        comment: item.comment || "",
      };
    });

    console.log("Creating order:", orderId);

    const order = new Order({
      orderId,
      dealer: dealer._id,
      dealerEmail: dealer.email,
      items,
      totalQuantity,
      status: "Pending",
    });

    const savedOrder = await order.save();

    console.log("ORDER SAVED:", savedOrder._id);

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order: savedOrder,
    });

  } catch (error) {
    console.error("========== CREATE ORDER ERROR ==========");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET DEALER ORDERS
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

    console.log(
      "Fetching orders for dealer:",
      dealerEmail
    );

    const orders = await Order.find({
      dealerEmail: dealerEmail,
    }).sort({
      createdAt: -1,
    });

    console.log(
      "Dealer orders found:",
      orders.length
    );

    return res.status(200).json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error(
      "========== GET DEALER ORDERS ERROR =========="
    );

    console.error(error);

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
      .populate(
        "dealer",
        "firstName lastName email companyName"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error(
      "========== GET ALL ORDERS ERROR =========="
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE ORDER
// ==========================================
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id
    ).populate(
      "dealer",
      "firstName lastName email companyName"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error(
      "========== GET ORDER ERROR =========="
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// UPDATE ORDER STATUS - ADMIN
// ==========================================
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Completed",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    order.status = req.body.status;

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });

  } catch (error) {
    console.error(
      "========== UPDATE ORDER STATUS ERROR =========="
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};