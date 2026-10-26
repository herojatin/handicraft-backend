
import express from "express";
import mongoose from "mongoose";

import Subcategory from "../models/Subcategory.js";
import Category from "../models/Category.js";

const router = express.Router();

// ================================================
// HELPERS
// ================================================

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeStatus = (status) => {
  return status === "Deactive" ||
    status === 0 ||
    status === "0"
    ? 0
    : 1;
};

// Find category using ObjectId, title, or serial ID
const findCategory = async (value) => {
  const searchValue = String(value).trim();

  if (mongoose.isValidObjectId(searchValue)) {
    const categoryById = await Category.findById(searchValue);

    if (categoryById) {
      return categoryById;
    }
  }

  if (/^\d+$/.test(searchValue)) {
    const categoryBySerial = await Category.findOne({
      serial_id: Number(searchValue),
    });

    if (categoryBySerial) {
      return categoryBySerial;
    }
  }

  return Category.findOne({
    title: {
      $regex: `^${escapeRegex(searchValue)}$`,
      $options: "i",
    },
  });
};

// ================================================
// ADD SUBCATEGORY
// ================================================

router.post("/", async (req, res) => {
  try {
    const { category, subcategory, status } = req.body;

    if (
      category === undefined ||
      typeof subcategory !== "string" ||
      !String(category).trim() ||
      !subcategory.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Category and subcategory are required",
      });
    }

    // Find parent category
    const existingCategory = await findCategory(category);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (typeof existingCategory.serial_id !== "number") {
      return res.status(400).json({
        success: false,
        message: "Category serial ID is missing",
      });
    }

    // Check duplicate within selected category
    const duplicate = await Subcategory.findOne({
      category_serial_id: existingCategory.serial_id,
      subcategory: {
        $regex: `^${escapeRegex(subcategory.trim())}$`,
        $options: "i",
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Subcategory already exists in this category",
      });
    }

    // Get highest subcategory serial ID
    const lastSubcategory = await Subcategory.findOne({
      subcategory_serial_id: { $type: "number" },
    }).sort({ subcategory_serial_id: -1 });

    const nextSerialId = lastSubcategory
      ? lastSubcategory.subcategory_serial_id + 1
      : 1;

    // Create subcategory
    const newSubcategory = await Subcategory.create({
      category_serial_id: existingCategory.serial_id,

      // Keep legacy category reference during migration
      category: String(existingCategory._id),

      subcategory: subcategory.trim(),

      status: normalizeStatus(status),

      product_serial_id: 0,

      subcategory_serial_id: nextSerialId,
    });

    return res.status(201).json({
      success: true,
      message: "Subcategory added successfully",
      newSubcategory,
    });
  } catch (error) {
    console.error("ADD SUBCATEGORY ERROR:", error);

    return res.status(
      error.code === 11000 ? 409 : 500
    ).json({
      success: false,
      message:
        error.code === 11000
          ? "Duplicate subcategory serial ID. Please retry."
          : error.message,
    });
  }
});

// ================================================
// GET ALL SUBCATEGORIES
// ================================================

router.get("/", async (req, res) => {
  try {
    const subcategories = await Subcategory.find()
      .sort({ subcategory_serial_id: 1 })
      .lean();

    // Resolve parent category using serial ID
    const categories = await Category.find(
      {},
      { title: 1, serial_id: 1 }
    ).lean();

    const categoryMap = new Map(
      categories.map((category) => [
        category.serial_id,
        category,
      ])
    );

    const result = subcategories.map((sub) => ({
      ...sub,
      categoryDetails:
        categoryMap.get(sub.category_serial_id) || null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("GET ALL SUBCATEGORIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ================================================
// GET SUBCATEGORIES BY CATEGORY
// ================================================

router.get("/:category", async (req, res) => {
  try {
    const existingCategory = await findCategory(
      req.params.category
    );

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (typeof existingCategory.serial_id !== "number") {
      return res.status(400).json({
        success: false,
        message: "Category serial ID is missing",
      });
    }

    // IMPORTANT: Relation using serial ID
    const subcategories = await Subcategory.find({
      category_serial_id: existingCategory.serial_id,
    }).sort({ subcategory_serial_id: 1 });

    console.log("CATEGORY:", existingCategory.title);
    console.log("SERIAL ID:", existingCategory.serial_id);
    console.log("SUBCATEGORIES FOUND:", subcategories.length);

    return res.status(200).json(subcategories);
  } catch (error) {
    console.error("GET SUBCATEGORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
