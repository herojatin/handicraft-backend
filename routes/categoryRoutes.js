import express from "express";
import upload from "../middleware/uploadMiddleware.js";

import {
  createCategory,
  getCategories,
  deleteCategory
} from "../controllers/categoryController.js";

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  createCategory
);

router.get(
  "/",
  getCategories
);

router.delete(
  "/:id",
  deleteCategory
);

export default router;