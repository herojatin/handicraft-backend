import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

import {
  createCatalogueProduct,
  getCatalogueProducts,
} from "../controllers/catalogueProductController.js";

const router = express.Router();

router.get("/", getCatalogueProducts);

router.post(
  "/",
  protectAdmin,
  upload.array("images", 10),
  createCatalogueProduct
);

export default router;