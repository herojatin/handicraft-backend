import CatalogueProduct from "../models/CatalogueProduct.js";
import Admin from "../models/Admin.js";

// ================= CREATE CATALOGUE PRODUCT =================
export const createCatalogueProduct = async (req, res) => {
  try {
    const {
      productCode,
      description,
      category,
      quantity,
      status,
    } = req.body;

    // Sizes
    let formattedSizes = [];
    if (req.body.sizes) {
      formattedSizes = JSON.parse(req.body.sizes);
    }

    // Sub Categories
    let formattedSubCategory = [];
    if (req.body.subCategory) {
      formattedSubCategory = JSON.parse(req.body.subCategory);
    }

    // Images
    const images = req.files
      ? req.files.map((file) => file.filename)
      : [];

    // Logged-in admin
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Auto Product Id
    const lastProduct = await CatalogueProduct.findOne().sort({
      productId: -1,
    });

    const productId = lastProduct
      ? lastProduct.productId + 1
      : 9001;

    const product = await CatalogueProduct.create({
      productId,
      productCode,
      description,
      category,
      subCategory: formattedSubCategory,
      sizes: formattedSizes,
      quantity,
      status,
      images,
      createdBy: admin.email,
      updatedBy: admin.email,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL =================
export const getCatalogueProducts = async (req, res) => {
  try {
    const products = await CatalogueProduct.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};