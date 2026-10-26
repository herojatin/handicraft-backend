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
  if (value == null || value === "") return [];

  if (Array.isArray(value)) {
    return value.flatMap(normalizeImages);
  }

  if (typeof value !== "string") return [];

  const raw = value.trim();

  if (!raw) return [];

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

const parseImageList = normalizeImages;

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
      // Treat as one subcategory.
    }

    return [value];
  }

  return [];
};

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

// Deletes legacy local files only.
// This does not delete AWS S3 objects.
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
// GENERATE AWS S3 SIGNED URLS FOR ALL IMAGES
// =====================================================

const withSignedImages = async (product) => {
  const images = normalizeImages(product.images);

  const imageUrls = await Promise.all(
    images.map(async (image) => {
      if (!image) return "";

      if (/^https?:\/\//i.test(image)) {
        return image;
      }

      try {
        const signedUrl = await getS3ImageUrl(image);
        return signedUrl || "";
      } catch (error) {
        console.error(
          "S3 IMAGE URL ERROR:",
          image,
          error
        );
        return "";
      }
    })
  );

  const validImageUrls = imageUrls.filter(Boolean);

  return {
    ...(typeof product.toObject === "function"
      ? product.toObject()
      : product),
    images,
    imageUrls:
      validImageUrls.length > 0
        ? validImageUrls
        : images,
  };
};

// =====================================================
// GET PRODUCTS — SEARCH + PAGINATION
// =====================================================

export const getProducts = async (req, res) => {
  try {
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(req.query.limit, 10) || 12
      )
    );

    const search = String(
      req.query.search || ""
    ).trim();

    const status = String(
      req.query.status || ""
    )
      .toLowerCase()
      .trim();

    const filter = {};

    // ACTIVE / INACTIVE FILTER
    if (
      status === "active" ||
      status === "1"
    ) {
      filter.status = 1;
    }

    if (
      ["inactive", "deactive", "0"].includes(status)
    ) {
      filter.status = 0;
    }

    // SEARCH PRODUCTS
    if (search) {
      const escaped = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        escaped,
        "i"
      );

      const conditions = [];

      // Search string fields available in the schema.
      for (const field of [
        "productCode",
        "productName",
        "name",
        "title",
        "category",
        "description",
      ]) {
        if (
          Product.schema.path(field)?.instance ===
          "String"
        ) {
          conditions.push({
            [field]: regex,
          });
        }
      }

      // Search subcategories.
      const subCategoryType =
        Product.schema.path("subCategory")
          ?.instance;

      if (
        subCategoryType === "String" ||
        subCategoryType === "Array"
      ) {
        conditions.push({
          subCategory: regex,
        });
      }

      // Search numeric product ID.
      if (
        /^\d+$/.test(search) &&
        Product.schema.path("productId")
          ?.instance === "Number"
      ) {
        conditions.push({
          productId: Number(search),
        });
      }

      // Search by subcategory serial ID.
      if (
        Product.schema.path(
          "subcategory_serial_id"
        )
      ) {
        const matches =
          await Subcategory.find({
            subcategory: regex,
          })
            .select("subcategory_serial_id")
            .lean();

        const serialIds = matches
          .map((item) =>
            Number(
              item.subcategory_serial_id
            )
          )
          .filter(Number.isFinite);

        if (serialIds.length) {
          conditions.push({
            subcategory_serial_id: {
              $in: serialIds,
            },
          });
        }
      }

      filter.$or = conditions.length
        ? conditions
        : [
            {
              _id: {
                $exists: false,
              },
            },
          ];
    }

    // COUNT AND FETCH PRODUCTS
    const [totalProducts, products] =
      await Promise.all([
        Product.countDocuments(filter),

        Product.find(filter)
          .sort({ _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      ]);

    // GENERATE SIGNED S3 URLS
    const productsWithImages =
      await Promise.all(
        products.map(withSignedImages)
      );

    const totalPages = Math.ceil(
      totalProducts / limit
    );

    console.log("GET PRODUCTS:", {
      page,
      limit,
      search,
      status,
      totalProducts,
      returnedProducts: products.length,
    });

    return res.status(200).json({
      success: true,
      products: productsWithImages,

      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "GET PRODUCTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
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

const uploadMultipleImagesToS3 = async (files = []) => {
  const uploadedImages = [];

  for (const file of files) {
    const result = await uploadToS3(file, "products");

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

// Store images according to your Mongoose schema.
// String  => "products/a.jpg,products/b.jpg"
// [String] => ["products/a.jpg", "products/b.jpg"]
const formatImagesForDatabase = (images) => {
  const uniqueImages = [
    ...new Set(normalizeImages(images)),
  ];

  const imageSchema = Product.schema.path("images");

  if (imageSchema?.instance === "Array") {
    return uniqueImages;
  }

  return uniqueImages.join(",");
};


// CREATE PRODUCT - MULTIPLE AWS S3 IMAGES


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

    // =================================================
    // UPLOAD MULTIPLE IMAGES TO AWS S3
    // =================================================

    const uploadedImages =
      await uploadMultipleImagesToS3(req.files || []);

    // Save S3 keys, not local file paths.
    const images = formatImagesForDatabase(
      uploadedImages
    );

    // =================================================
    // CREATE PRODUCT IN MONGODB
    // =================================================

    const product = await Product.create({
  productId,
  productCode: productCode.trim(),
  description,
  category,

  // MongoDB schema expects a string, not an array.
  // Empty selection becomes an empty string.
  subCategory: selectedSubcategories.join(", "),

  subcategory_serial_id: subcategorySerialId,

  length,
  width,
  height,
  quantity: Number(quantity || 0),
  status: normalizeStatus(status),
  createdBy,
  images,
});

    // Generate signed image URLs for frontend.
    const productWithImages =
      await withSignedImages(product);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: productWithImages,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =====================================================
// UPDATE PRODUCT
// =====================================================

// =====================================================
// UPDATE PRODUCT - MULTIPLE AWS S3 IMAGES
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

    // =================================================
    // CATEGORY AND SUBCATEGORY
    // =================================================

    const selectedCategory =
      category ?? product.category;

    const selectedSubcategories =
      subCategory !== undefined
        ? normalizeSubcategories(subCategory)
        : normalizeSubcategories(product.subCategory);

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

    // =================================================
    // GET EXISTING IMAGES
    // =================================================

    // Supports:
    // "uploads/DI 01535.JPG,uploads/DI 01535A.JPG"
    // ["products/a.jpg", "products/b.jpg"]

    const storedImages = normalizeImages(
      product.images
    );

    // Existing images can be sent from frontend.
    // Only images already belonging to this product are accepted.
    const requestedExisting =
      existingImages !== undefined
        ? normalizeImages(existingImages)
        : storedImages;

    const storedSet = new Set(storedImages);

    const validExisting = requestedExisting.filter(
      (image) => storedSet.has(image)
    );

    // =================================================
    // REMOVE SELECTED IMAGES
    // =================================================

    const imagesToRemove = new Set(
      normalizeImages(removedImages)
    );

    const keptImages = validExisting.filter(
      (image) => !imagesToRemove.has(image)
    );

    // =================================================
    // UPLOAD NEW IMAGES TO AWS S3
    // =================================================

    const newImages =
      await uploadMultipleImagesToS3(req.files || []);

    // =================================================
    // MERGE EXISTING + NEW IMAGES
    // =================================================

    const finalImages = [
      ...new Set([
        ...keptImages,
        ...newImages,
      ]),
    ];

    // Save using the format defined in Product schema.
    product.images = formatImagesForDatabase(
      finalImages
    );

    // =================================================
    // UPDATE PRODUCT FIELDS
    // =================================================

    if (productCode !== undefined) {
      product.productCode = productCode.trim();
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (category !== undefined) {
      product.category = category;
    }

   if (subCategory !== undefined) {
  product.subCategory = selectedSubcategories.join(", ");
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
      product.status = normalizeStatus(status);
    }

    // =================================================
    // SAVE UPDATED PRODUCT
    // =================================================

    const updatedProduct = await product.save();

    // Generate signed URLs for all remaining images.
    const productWithImages =
      await withSignedImages(updatedProduct);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: productWithImages,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

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

    const images =
      normalizeImages(product.images);

    await Product.findByIdAndDelete(
      req.params.id
    );

    // Deletes legacy local files only.
    // AWS S3 objects are not deleted here.
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