import express from "express";

import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/catalogueCategoryController.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  protectAdmin,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Category
router.post(
  "/",
  protectAdmin,
  authorizeRoles("superadmin", "admin"),
  upload.single("image"),
  createCategory
);

// Get All
router.get("/", getCategories);

// Get One
router.get("/:id", getCategory);

// Update
router.put(
  "/:id",
  protectAdmin,
  authorizeRoles("superadmin", "admin"),
  upload.single("image"),
  updateCategory
);

// Delete
router.delete(
  "/:id",
  protectAdmin,
  authorizeRoles("superadmin", "admin"),
  deleteCategory
);

export default router;