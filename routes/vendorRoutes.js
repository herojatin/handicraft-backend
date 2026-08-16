import express from "express";
console.log("vendorRoutes.js loaded");

import {
  getVendors,
  updateVendor,
  deleteVendor,
} from "../controllers/vendorController.js";

const router = express.Router();

// GET ALL VENDORS
router.get("/", getVendors);

// TEST ROUTE (optional)
router.get("/test", (req, res) => {
  res.send("Vendor Route Working");
});

// UPDATE
router.put("/:id", updateVendor);

// DELETE
router.delete("/:id", deleteVendor);

export default router;