
import Category from "../models/Category.js";

// ================================================
// CREATE CATEGORY
// ================================================

export const createCategory = async (req, res) => {
  try {
    const { title, status } = req.body;

    // Validate category title
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category title is required",
      });
    }

    // Check duplicate category
    const existingCategory = await Category.findOne({
      title: {
        $regex: `^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Find highest existing serial_id
    const lastCategory = await Category.findOne({
      serial_id: { $type: "number" },
    }).sort({ serial_id: -1 });

    // Generate next serial_id
    const nextSerialId = lastCategory
      ? lastCategory.serial_id + 1
      : 1;

    // Convert status to numeric value
    const numericStatus =
      status === "Deactive" ||
      status === "0" ||
      status === 0
        ? 0
        : 1;

    // Create new category
    const category = await Category.create({
      title: title.trim(),
      status: numericStatus,
      serial_id: nextSerialId,
      image: req.file
        ? req.file.filename
        : null,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });

  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================================
// GET CATEGORIES
// ================================================

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ serial_id: 1 });

    return res.status(200).json(categories);

  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================================
// DELETE CATEGORY
// ================================================

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });

  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
