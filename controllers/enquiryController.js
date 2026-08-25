import Order from "../models/orderModel.js";
import Dealer from "../models/dealerModel.js";

export const sendEnquiry = async (req, res) => {
  try {
    const { cart, orderId, dealerEmail } = req.body;

    if (!cart || cart.length === 0) {
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

    // Find dealer
    const dealer = await Dealer.findOne({
      email: dealerEmail,
    });

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found.",
      });
    }

    // Calculate total quantity
    const totalQuantity = cart.reduce(
      (total, item) => total + Number(item.quantity || 1),
      0
    );

    // Create order
    const order = await Order.create({
      orderId,
      dealer: dealer._id,
      dealerEmail: dealer.email,

      items: cart.map((item) => ({
        productId: item._id || item.id,
        productCode: item.productCode || "",
        productName:
          item.name ||
          item.productName ||
          item.description ||
          "Product",
        quantity: Number(item.quantity || 1),
        image: Array.isArray(item.images)
          ? item.images[0]
          : item.image || "",
        category: item.category || "",
        subCategory: item.subCategory || "",
        comment: item.comment || "",
      })),

      totalQuantity,
    });

    /*
      Keep your existing Excel/email code here.
      The important part is that the order has now
      been saved in MongoDB.
    */

    return res.status(201).json({
      success: true,
      message: "Enquiry sent successfully.",
      order,
    });
  } catch (error) {
    console.error("Send enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send enquiry.",
      error: error.message,
    });
  }
};