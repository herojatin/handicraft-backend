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

    // Generate Product ID
    const lastProduct = await CatalogueProduct.findOne({
      productId: { $exists: true },
    }).sort({ productId: -1 });

    const newProductId = lastProduct
      ? lastProduct.productId + 1
      : 9001;

    // Parse Sizes
    let formattedSizes = [];

    if (req.body.sizes) {
      try {
        formattedSizes = JSON.parse(req.body.sizes);
      } catch {
        formattedSizes = [];
      }
    }

    // Parse Sub Categories
    let formattedSubCategory = [];

    if (req.body.subCategory) {
      try {
        formattedSubCategory = JSON.parse(req.body.subCategory);
      } catch {
        formattedSubCategory = [req.body.subCategory];
      }
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

    // Save Product
    const product = await CatalogueProduct.create({
      productId: newProductId,
      productCode,
      description,
      category,
      subCategory: formattedSubCategory,
      sizes: formattedSizes,
      quantity,
      status: status || "Active",
      images,
      createdBy: admin.email,
      updatedBy: admin.email,
    });

    res.status(201).json({
      success: true,
      message: "Catalogue Product Added Successfully",
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

// ================= GET ALL CATALOGUE PRODUCTS =================
export const getCatalogueProducts = async (req, res) => {
  try {
    const products = await CatalogueProduct.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
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