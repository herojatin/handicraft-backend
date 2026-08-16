import Category from "../models/Category.js";


// ================= CREATE CATEGORY =================

export const createCategory = async (
  req,
  res
) => {
  try {

    const { title, status } = req.body;

    const category = await Category.create({
      title,
      status,
      image: req.file
        ? req.file.filename
        : null,
    });

    res.status(201).json({
      success: true,
      category,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};


// ================= GET CATEGORIES =================

export const getCategories = async (
  req,
  res
) => {
  try {

    const categories = await Category.find();

    res.status(200).json(categories);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });

  }
};

// Delete category

export const deleteCategory = async (req, res) => {

  try {

    const category = await Category.findByIdAndDelete(
      req.params.id
    );

    if (!category) {

      return res.status(404).json({
        message: "Category not found"
      });

    }

    res.status(200).json({
      message: "Category deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};