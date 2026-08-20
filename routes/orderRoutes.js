import express from "express";

import {
  createOrder,
  getOrders,
  getDealerOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE ORDER - DEALER
router.post("/", createOrder);

// GET DEALER ORDERS
router.get("/dealer/:dealerEmail", getDealerOrders);

// GET ALL ORDERS - ADMIN
router.get("/", protectAdmin, getOrders);

// GET SINGLE ORDER - ADMIN
router.get("/:id", protectAdmin, getOrderById);

// UPDATE ORDER STATUS - ADMIN
router.put("/:id/status", protectAdmin, updateOrderStatus);

export default router;