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

// GET PRODUCTS
router.get(
  "/",
  getProducts
);

// CREATE PRODUCT
router.post(
  "/",
  protectAdmin,
  upload.array("images", 10),
  createProduct
);

// UPDATE PRODUCT
router.put(
  "/admin/:id",
  protectAdmin,
  upload.array("images", 10),
  updateProduct
);

// DELETE PRODUCT
router.delete(
  "/admin/:id",
  protectAdmin,
  deleteProduct
);

export default router;