import fs from "fs";
import path from "path";

import Product from "../models/Product.js";
import Subcategory from "../models/Subcategory.js";
import Category from "../models/Category.js";

import uploadToS3 from "../utils/uploadToS3.js";
import { getS3ImageUrl } from "../utils/getS3ImageUrl.js";

// =====================================================
// HELPERS
// =====================================================

// Supports:
// 1. Comma-separated image strings from MongoDB
// 2. Arrays of images
// 3. JSON-formatted image arrays
const normalizeImages = (value) => {
  if (value == null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(normalizeImages);
  }

  if (typeof value !== "string") {
    return [];
  }

  const raw = value.trim();

  if (!raw) {
    return [];
  }

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return normalizeImages(parsed);
      }
    } catch {
      // Handle legacy comma-separated image strings.
    }
  }

  return raw
    .split(",")
    .map((image) => image.trim())
    .filter(Boolean);
};

// =====================================================
// NORMALIZE SUBCATEGORIES
// =====================================================

const normalizeSubcategories = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      // Treat as a single subcategory.
    }

    return [value];
  }

  return [];
};

// =====================================================
// NORMALIZE STATUS
// =====================================================

const normalizeStatus = (status) => {
  if (
    status === "Deactive" ||
    status === 0 ||
    status === "0"
  ) {
    return 0;
  }

  return 1;
};

// =====================================================
// GET LOCAL IMAGE PATH
// =====================================================

const getImagePath = (image) => {
  const filename = path.basename(
    String(image).replace(/\\/g, "/")
  );

  return path.join(
    process.cwd(),
    "uploads",
    filename
  );
};

// =====================================================
// DELETE LEGACY LOCAL IMAGE FILES
// =====================================================

// Only deletes local files.
// Does not delete AWS S3 objects.

const deleteImageFiles = (images) => {
  for (const image of normalizeImages(images)) {
    try {
      const imagePath = getImagePath(image);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (error) {
      console.error(
        "IMAGE DELETE ERROR:",
        error
      );
    }
  }
};

// =====================================================
// GET SUBCATEGORY SERIAL ID
// =====================================================

const getSubcategorySerialId = async (
  categoryName,
  subcategories
) => {
  if (!subcategories.length) {
    return 0;
  }

  const category = await Category.findOne({
    title: categoryName,
  });

  if (!category) {
    throw new Error(
      "Selected category not found"
    );
  }

  const selectedSubcategory =
    await Subcategory.findOne({
      category: category._id,
      subcategory: subcategories[0],
    });

  if (!selectedSubcategory) {
    throw new Error(
      "Selected subcategory not found"
    );
  }

  return selectedSubcategory.subcategory_serial_id;
};

// =====================================================
// NORMALIZE S3 OBJECT KEY
// =====================================================

// Examples:
//
// products/image.png
// uploads/DI 2206.JPG
// /uploads/DI 2206.JPG
//
// The object key must match the actual key in S3.

const normalizeS3Key = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  return image
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
};

// =====================================================
// GENERATE SIGNED URL FOR ONE IMAGE
// =====================================================

const generateImageUrl = async (image) => {
  try {
    if (!image || typeof image !== "string") {
      return "";
    }

    // Preserve existing complete URLs.
    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    const key = normalizeS3Key(image);

    if (!key) {
      return "";
    }

    const signedUrl = await getS3ImageUrl(key);

    return signedUrl || "";

  } catch (error) {
    console.error(
      "S3 IMAGE URL ERROR:",
      image,
      error.message
    );

    return "";
  }
};

// =====================================================
// GENERATE SIGNED URLS FOR ALL PRODUCT IMAGES
// =====================================================

const withSignedImages = async (product) => {
  const productData =
    typeof product.toObject === "function"
      ? product.toObject()
      : product;

  const images = normalizeImages(
    productData.images
  );

  // Keep URLs aligned with the original image order.
  const imageUrls = await Promise.all(
    images.map(generateImageUrl)
  );

  return {
    ...productData,
    images,
    imageUrls,
  };
};

// =====================================================
// GET PRODUCTS
// =====================================================

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    const productsWithImages =
      await Promise.all(
        products.map(withSignedImages)
      );

    return res.status(200).json({
      success: true,
      products: productsWithImages,
    });

  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// =====================================================
// AWS S3 MULTIPLE IMAGE HELPERS
// =====================================================

const extractS3Key = (result) => {
  if (typeof result === "string") {
    return result;
  }

  if (result && typeof result === "object") {
    return (
      result.key ||
      result.Key ||
      result.s3Key ||
      result.path ||
      null
    );
  }

  return null;
};

// =====================================================
// UPLOAD MULTIPLE IMAGES TO AWS S3
// =====================================================

const uploadMultipleImagesToS3 = async (
  files = []
) => {
  const uploadedImages = [];

  for (const file of files) {
    const result = await uploadToS3(
      file,
      "products"
    );

    const key = extractS3Key(result);

    if (!key) {
      throw new Error(
        `S3 upload did not return an image key for ${file.originalname}`
      );
    }

    uploadedImages.push(key);
  }

  return uploadedImages;
};

// =====================================================
// FORMAT IMAGES FOR MONGODB
// =====================================================

// Supports both:
//
// images: ["products/a.jpg", "products/b.jpg"]
//
// images: "products/a.jpg,products/b.jpg"

const formatImagesForDatabase = (images) => {
  const uniqueImages = [
    ...new Set(normalizeImages(images)),
  ];

  const imageSchema =
    Product.schema.path("images");

  if (imageSchema?.instance === "Array") {
    return uniqueImages;
  }

  return uniqueImages.join(",");
};

// =====================================================
// CREATE PRODUCT
// =====================================================

export const createProduct = async (req, res) => {
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

    // Validate product code.
    if (!productCode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    // Normalize subcategories.
    const selectedSubcategories =
      normalizeSubcategories(subCategory);

    // Get subcategory serial ID.
    const subcategorySerialId =
      await getSubcategorySerialId(
        category,
        selectedSubcategories
      );

    // =============================================
    // UPLOAD IMAGES TO AWS S3
    // =============================================

    const uploadedImages =
      await uploadMultipleImagesToS3(
        req.files || []
      );

    // Save S3 object keys in MongoDB.
    const images = formatImagesForDatabase(
      uploadedImages
    );

    // =============================================
    // CREATE PRODUCT IN MONGODB
    // =============================================

    const product = await Product.create({
      productId,

      productCode: productCode.trim(),

      description,

      category,

      subCategory:
        selectedSubcategories.join(", "),

      subcategory_serial_id:
        subcategorySerialId,

      length,
      width,
      height,

      quantity: Number(quantity || 0),

      status: normalizeStatus(status),

      createdBy,

      images,
    });

    // Generate signed URLs for the frontend.
    const productWithImages =
      await withSignedImages(product);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: productWithImages,
    });

  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

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

    // =============================================
    // CATEGORY AND SUBCATEGORY
    // =============================================

    const selectedCategory =
      category ?? product.category;

    const selectedSubcategories =
      subCategory !== undefined
        ? normalizeSubcategories(subCategory)
        : normalizeSubcategories(
            product.subCategory
          );

    if (
      category !== undefined ||
      subCategory !== undefined
    ) {
      product.subcategory_serial_id =
        await getSubcategorySerialId(
          selectedCategory,
          selectedSubcategories
        );
    }

    // =============================================
    // GET EXISTING IMAGES
    // =============================================

    const storedImages = normalizeImages(
      product.images
    );

    const requestedExisting =
      existingImages !== undefined
        ? normalizeImages(existingImages)
        : storedImages;

    const storedSet = new Set(
      storedImages
    );

    // Only accept existing images that already
    // belong to this product.
    const validExisting =
      requestedExisting.filter(
        (image) => storedSet.has(image)
      );

    // =============================================
    // REMOVE SELECTED IMAGES
    // =============================================

    const imagesToRemove = new Set(
      normalizeImages(removedImages)
    );

    const keptImages =
      validExisting.filter(
        (image) => !imagesToRemove.has(image)
      );

    // =============================================
    // UPLOAD NEW IMAGES TO AWS S3
    // =============================================

    const newImages =
      await uploadMultipleImagesToS3(
        req.files || []
      );

    // =============================================
    // MERGE EXISTING + NEW IMAGES
    // =============================================

    const finalImages = [
      ...new Set([
        ...keptImages,
        ...newImages,
      ]),
    ];

    product.images =
      formatImagesForDatabase(finalImages);

    // =============================================
    // UPDATE PRODUCT FIELDS
    // =============================================

    if (productCode !== undefined) {
      product.productCode =
        productCode.trim();
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (subCategory !== undefined) {
      product.subCategory =
        selectedSubcategories.join(", ");
    }

    if (length !== undefined) {
      product.length = length;
    }

    if (width !== undefined) {
      product.width = width;
    }

    if (height !== undefined) {
      product.height = height;
    }

    if (quantity !== undefined) {
      product.quantity = Number(quantity);
    }

    if (status !== undefined) {
      product.status = normalizeStatus(
        status
      );
    }

    // =============================================
    // SAVE UPDATED PRODUCT
    // =============================================

    const updatedProduct =
      await product.save();

    const productWithImages =
      await withSignedImages(
        updatedProduct
      );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: productWithImages,
    });

  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// DELETE PRODUCT
// =====================================================

export const deleteProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const images = normalizeImages(
      product.images
    );

    await Product.findByIdAndDelete(
      req.params.id
    );

    // Delete legacy local files only.
    // S3 objects are not deleted.
    deleteImageFiles(images);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE PRODUCT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};