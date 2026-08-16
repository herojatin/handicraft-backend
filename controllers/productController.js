import Product from "../models/Product.js";
import fs from "fs";
import path from "path";

// =====================================================
// GET PRODUCTS
// =====================================================

export const getProducts = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find().sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      products,
    });

  } catch (error) {

    console.error(
      "Get products error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to fetch products",
    });
  }
};

// =====================================================
// CREATE PRODUCT
// =====================================================

export const createProduct = async (
  req,
  res
) => {
  try {

    const {
      productId,
      productCode,
      description,
      category,
      subCategory,
      length,
      width,
      height,
      quantity,
      status,
      createdBy,
    } = req.body;

    // =================================================
    // IMAGES
    // =================================================

    const images =
      req.files?.map(
        (file) => file.filename
      ) || [];

    // =================================================
    // CREATE PRODUCT
    // =================================================

    const product =
      await Product.create({

        productId,

        productCode,

        description,

        category,

        subCategory:
          Array.isArray(subCategory)
            ? subCategory
            : subCategory
            ? [subCategory]
            : [],

        length,

        width,

        height,

        quantity,

        status,

        createdBy,

        images,
      });

    res.status(201).json({
      success: true,
      message:
        "Product created successfully",
      product,
    });

  } catch (error) {

    console.error(
      "Create product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

export const updateProduct = async (
  req,
  res
) => {
  try {

    const { id } = req.params;

    // =================================================
    // FIND PRODUCT
    // =================================================

    const product =
      await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    // =================================================
    // BODY DATA
    // =================================================

    const {
      productCode,
      description,
      category,
      subCategory,
      length,
      width,
      height,
      quantity,
      status,
      existingImages,
      removedImages,
    } = req.body;

    // =================================================
    // EXISTING IMAGES TO KEEP
    // =================================================

    let currentImages = [];

    try {

      if (existingImages) {

        currentImages =
          JSON.parse(
            existingImages
          );

      }

    } catch (error) {

      console.error(
        "Existing images parse error:",
        error
      );

      currentImages = [];
    }

    // =================================================
    // SUPPORT OLD `image` FIELD
    // =================================================

    if (
      currentImages.length === 0 &&
      product.image
    ) {
      currentImages = [
        product.image,
      ];
    }

    // =================================================
    // REMOVED IMAGES
    // =================================================

    let imagesToRemove = [];

    try {

      if (removedImages) {

        imagesToRemove =
          JSON.parse(
            removedImages
          );

      }

    } catch (error) {

      console.error(
        "Removed images parse error:",
        error
      );

      imagesToRemove = [];
    }

    // =================================================
    // DELETE REMOVED IMAGE FILES
    // =================================================

    for (
      const image of imagesToRemove
    ) {

      if (!image) {
        continue;
      }

      const imagePath =
        path.join(
          process.cwd(),
          "uploads",
          image
        );

      if (
        fs.existsSync(
          imagePath
        )
      ) {

        try {

          fs.unlinkSync(
            imagePath
          );

          console.log(
            "Deleted image:",
            image
          );

        } catch (error) {

          console.error(
            "Unable to delete image:",
            image,
            error
          );
        }
      }
    }

    // =================================================
    // NEW IMAGES
    // =================================================

    const newImages =
      req.files?.map(
        (file) => file.filename
      ) || [];

    // =================================================
    // FINAL IMAGE LIST
    // =================================================

    const finalImages = [
      ...currentImages,
      ...newImages,
    ];

    // =================================================
    // UPDATE PRODUCT DATA
    // =================================================

    product.productCode =
      productCode ??
      product.productCode;

    product.description =
      description ??
      product.description;

    product.category =
      category ??
      product.category;

    product.subCategory =
      Array.isArray(
        subCategory
      )
        ? subCategory
        : subCategory
        ? [subCategory]
        : product.subCategory;

    product.length =
      length ??
      product.length;

    product.width =
      width ??
      product.width;

    product.height =
      height ??
      product.height;

    product.quantity =
      quantity !== undefined
        ? Number(quantity)
        : product.quantity;

    product.status =
      status ??
      product.status;

    product.images =
      finalImages;

    // =================================================
    // SAVE
    // =================================================

    const updatedProduct =
      await product.save();

    res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product:
        updatedProduct,
    });

  } catch (error) {

    console.error(
      "Update product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// DELETE PRODUCT
// =====================================================

export const deleteProduct = async (
  req,
  res
) => {
  try {

    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    // =================================================
    // DELETE PRODUCT IMAGES
    // =================================================

    if (
      product.images?.length
    ) {

      for (
        const image of product.images
      ) {

        if (!image) {
          continue;
        }

        const imagePath =
          path.join(
            process.cwd(),
            "uploads",
            image
          );

        if (
          fs.existsSync(
            imagePath
          )
        ) {

          try {

            fs.unlinkSync(
              imagePath
            );

            console.log(
              "Deleted image:",
              image
            );

          } catch (error) {

            console.error(
              "Unable to delete image:",
              image,
              error
            );
          }
        }
      }
    }

    // =================================================
    // DELETE PRODUCT
    // =================================================

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete product error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};