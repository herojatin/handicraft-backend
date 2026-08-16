import express from "express";
import {
  createTestimonial,
  getAllTestimonials,
  getApprovedTestimonials,
  getPendingTestimonials,
  approveTestimonial,
  rejectTestimonial,
  restoreTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";

import { protectAdmin } from "../middleware/protectAdminMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protectAdmin,
  getAllTestimonials
);

router.get("/approved", getApprovedTestimonials);

router.get("/pending", protectAdmin, getPendingTestimonials);

router.put(
  "/approve/:id",
  protectAdmin,
  approveTestimonial
);

router.post("/", createTestimonial);

router.put(
  "/reject/:id",
  protectAdmin,
  rejectTestimonial
);

router.put(
  "/restore/:id",
  protectAdmin,
  restoreTestimonial
);

router.delete(
  "/:id",
  protectAdmin,
  deleteTestimonial
);





export default router;