import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} from "../controllers/orderController.js";

import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// create new order (customer)
router.post("/", createOrder);

// get all orders (admin)
router.get("/", protectAdmin, getOrders);

// get single order
router.get("/:id", protectAdmin, getOrderById);

// update order status (admin)
router.put("/:id/status", protectAdmin, updateOrderStatus);


export default router;