import express from "express";

import {
  registerDealer,
  loginDealer,
  getAllDealers,
  updateDealerAccess,
  deleteDealer,
} from "../controllers/dealerController.js";

// Use your existing admin middleware
import { protectAdmin, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
=========================================
Dealer Authentication
=========================================
*/

router.post("/register", registerDealer);

router.post("/login", loginDealer);

/*
=========================================
Admin Dealer Management
=========================================
*/

router.get(
  "/",
  protectAdmin,
  authorizeRoles("superadmin", "admin"),
  getAllDealers
);

router.put(
  "/:id/access",
  protectAdmin,
  authorizeRoles("superadmin", "admin"),
  updateDealerAccess
);

router.delete(
  "/:id",
  protectAdmin,
  authorizeRoles("superadmin", "admin"),
  deleteDealer
);

export default router;