
import express from "express";

import {
  createOrder,
  getDealerOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
  downloadOrderExcel,
  deleteOrder,
} from "../controllers/orderController.js";

import { protectAdmin } from "../middleware/authMiddleware.js";
import { protectDealer } from "../middleware/dealerAuthMiddleware.js";

const router = express.Router();

// ==========================================
// DEALER ROUTES
// ==========================================

// Create enquiry from dealer cart
router.post("/", protectDealer, createOrder);

// Get logged-in dealer's orders
router.get("/my-orders", protectDealer, getDealerOrders);

// Download dealer Excel (without prices)
router.get(
  "/my-orders/:id/excel",
  protectDealer,
  (req, res) => {
    req.excelRole = "dealer";
    return downloadOrderExcel(req, res);
  }
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all orders
router.get("/", protectAdmin, getOrders);

// Download admin Excel (with editable prices)
router.get(
  "/:id/excel",
  protectAdmin,
  (req, res) => {
    req.excelRole = "admin";
    return downloadOrderExcel(req, res);
  }
);
// Delete router
router.delete("/:id", protectAdmin, deleteOrder);

// Get single order
router.get("/:id", protectAdmin, getOrderById);

// Update order status
router.put("/:id/status", protectAdmin, updateOrderStatus);

export default router;
