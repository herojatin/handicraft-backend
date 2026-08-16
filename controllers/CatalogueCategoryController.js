import CatalogueCategory from "../models/CatalogueCategory.js";

// ======================
// Create Category
// ======================

export const createCategory = async (req, res) => {
  try {
    const { title, status } = req.body;

    const existing = await CatalogueCategory.findOne({
      title,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const image = req.file ? req.file.filename : "";

    const category = await CatalogueCategory.create({
      title,
      image,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================
// Get Categories
// ======================

export const getCategories = async (req, res) => {
  try {
    const categories = await CatalogueCategory.find({
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch categories",
    });
  }
};

// ======================
// Get Single Category
// ======================

export const getCategory = async (req, res) => {
  try {
    const category = await CatalogueCategory.findById(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json(category);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================
// Update Category
// ======================

export const updateCategory = async (req, res) => {
  try {
    const { title, status } = req.body;

    const category =
      await CatalogueCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.title = title;
    category.status = status;

    if (req.file) {
      category.image = req.file.filename;
    }

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================
// Delete Category
// ======================

export const deleteCategory = async (req, res) => {
  try {
    const category =
      await CatalogueCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isDeleted = true;

    await category.save();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};