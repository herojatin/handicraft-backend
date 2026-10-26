import express from "express";

import {
  createProductQuery,
} from "../controllers/productQueryController.js";

const router = express.Router();

// CREATE PRODUCT QUESTION
router.post(
  "/",
  createProductQuery
);

export default router;