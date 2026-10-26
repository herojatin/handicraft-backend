import express from "express";

import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from "../controllers/faqController.js";

import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin - get all questions
router.get("/", protectAdmin, getFAQs);

// Create question
router.post("/", createFAQ);

// Admin - answer question
router.put("/:id", protectAdmin, updateFAQ);

// Admin - delete question
router.delete("/:id", protectAdmin, deleteFAQ);

export default router;