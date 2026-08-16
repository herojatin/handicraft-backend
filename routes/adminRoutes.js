import express from "express";

import {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "../controllers/adminController.js";

import { protectAdmin, authorizeRoles } from "../middleware/authMiddleware.js";


const router = express.Router();

// Super Admin Only
router.post(
  "/",
  protectAdmin,
  authorizeRoles("superadmin"),
  createAdmin
);

// Super Admin Only
router.get(
  "/",
  protectAdmin,
  authorizeRoles("superadmin"),
  getAdmins
);

// Super Admin Only
router.get(
  "/:id",
  protectAdmin,
  authorizeRoles("superadmin"),
  getAdminById
);

// Super Admin Only
router.put(
  "/:id",
  protectAdmin,
  authorizeRoles("superadmin"),
  updateAdmin
);

// Super Admin Only
router.delete(
  "/:id",
  protectAdmin,
  authorizeRoles("superadmin"),
  deleteAdmin
);

export default router;