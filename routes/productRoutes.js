
import express from "express";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import {
  protectAdmin,
} from "../middleware/protectAdminMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ================================================
// GET ALL PRODUCTS - PUBLIC
// ================================================

router.get("/", getProducts);

// ================================================
// GET ALL PRODUCTS - ADMIN
// ================================================

router.get(
  "/admin",
  protectAdmin,
  getProducts
);

// ================================================
// CREATE PRODUCT
// ================================================

router.post(
  "/",
  protectAdmin,
  upload.array("images", 10),
  createProduct
);

// ================================================
// UPDATE PRODUCT - ADMIN
// ================================================

router.put(
  "/admin/:id",
  protectAdmin,
  upload.array("images", 10),
  updateProduct
);

// ================================================
// UPDATE PRODUCT
// ================================================

router.put(
  "/:id",
  protectAdmin,
  upload.array("images", 10),
  updateProduct
);

// ================================================
// DELETE PRODUCT - ADMIN
// ================================================

router.delete(
  "/admin/:id",
  protectAdmin,
  deleteProduct
);

// ================================================
// DELETE PRODUCT
// ================================================

router.delete(
  "/:id",
  protectAdmin,
  deleteProduct
);

export default router;
