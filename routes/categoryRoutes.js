import express from "express";
import upload from "../middleware/uploadMiddleware.js";

import {
  createCategory,
  getCategories,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// CREATE CATEGORY
router.post("/", upload.single("image"), createCategory);

// GET ALL CATEGORIES
router.get("/", getCategories);

// DELETE CATEGORY
router.delete("/:id", deleteCategory);

export default router;