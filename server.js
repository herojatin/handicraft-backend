import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

// =====================================================
// ROUTE IMPORTS
// =====================================================

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subcategoryRoutes from "./routes/subcategoryRoutes.js";

import adminRoutes from "./routes/adminRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import dealerRoutes from "./routes/dealerRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";

import catalogueCategoryRoutes from "./routes/catalogueCategoryRoutes.js";
import catalogueProductRoutes from "./routes/catalogueProductRoutes.js";

import enquiryRoutes from "./routes/enquiryRoutes.js";
import productQueryRoutes from "./routes/productQueryRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";

// AWS S3 ROUTES
import s3TestRoutes from "./routes/s3TestRoutes.js";
import s3ImageRoutes from "./routes/s3ImageRoutes.js";

// ADMIN MODEL
import Admin from "./models/Admin.js";

// =====================================================
// ENVIRONMENT CONFIGURATION
// =====================================================

dotenv.config();

// Prevent Mongoose from automatically creating indexes
mongoose.set("autoIndex", false);

// =====================================================
// EXPRESS APPLICATION
// =====================================================

const app = express();

// =====================================================
// DIRECTORY CONFIGURATION
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(__dirname, "uploads");

// =====================================================
// BASIC MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// BACKEND HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Haswani Handicrafts Backend Running",
  });
});

// =====================================================
// S3 DEPLOYMENT HEALTH CHECK
// =====================================================

app.get("/health-s3", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Updated S3 backend is running",
    s3BucketConfigured: Boolean(
      process.env.AWS_S3_BUCKET_NAME
    ),
    awsRegionConfigured: Boolean(
      process.env.AWS_REGION
    ),
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// IMAGE REQUEST LOGGER
// =====================================================

app.use("/uploads", (req, res, next) => {
  console.log("====================================");
  console.log("IMAGE REQUEST RECEIVED");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("====================================");

  next();
});

// =====================================================
// S3 ROUTER TEST
// =====================================================

// Temporary diagnostic route.
// Remove this after confirming the deployment works.

app.get("/uploads/route-test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "S3 image route registration is working",
  });
});

// =====================================================
// LOCAL IMAGE STORAGE
// =====================================================

// Serve existing images from local uploads directory.

app.use(
  "/uploads",
  express.static(uploadsPath)
);

// =====================================================
// AWS S3 IMAGE FALLBACK
// =====================================================

// If an image is not found locally,
// Express continues to the S3 image router.
//
// Example:
// GET /uploads/DI%2001135.JPG
//
// S3 object key:
// uploads/DI 01135.JPG

app.use("/uploads", s3ImageRoutes);

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/subcategories", subcategoryRoutes);

app.use("/api/admins", adminRoutes);

app.use("/api/testimonials", testimonialRoutes);

app.use("/api/contact", contactRoutes);

app.use("/api/dealers", dealerRoutes);

app.use("/api/instagram", instagramRoutes);

// =====================================================
// CATALOGUE ROUTES
// =====================================================

app.use(
  "/api/catalogue/categories",
  catalogueCategoryRoutes
);

app.use(
  "/api/catalogue/products",
  catalogueProductRoutes
);

// =====================================================
// ENQUIRY AND PRODUCT QUERY ROUTES
// =====================================================

app.use("/api/enquiry", enquiryRoutes);

app.use(
  "/api/product-queries",
  productQueryRoutes
);

// =====================================================
// FAQ ROUTES
// =====================================================

app.use("/api/faqs", faqRoutes);

// =====================================================
// AWS S3 TEST ROUTES
// =====================================================

app.use("/api/s3", s3TestRoutes);

// =====================================================
// DEFAULT SUPER ADMIN
// =====================================================

const createAdmin = async () => {
  try {
    const exists = await Admin.findOne({
      email: "admin@haswani.com",
    });

    if (!exists) {
      const hashedPassword = await bcrypt.hash(
        "123456",
        10
      );

      await Admin.create({
        name: "Super Admin",
        email: "admin@haswani.com",
        password: hashedPassword,
        role: "superadmin",
      });

      console.log("Default Super Admin Created");
    }
  } catch (error) {
    console.error(
      "Admin Creation Error:",
      error
    );
  }
};

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  console.log("ROUTE NOT FOUND:", req.originalUrl);

  return res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("====================================");
    console.log("STARTING HASWANI BACKEND");
    console.log("====================================");

    console.log(
      "AWS S3 BUCKET CONFIGURED:",
      Boolean(process.env.AWS_S3_BUCKET_NAME)
    );

    console.log(
      "AWS REGION CONFIGURED:",
      Boolean(process.env.AWS_REGION)
    );

    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log("MongoDB connection successful");

    await createAdmin();

    app.listen(PORT, () => {
      console.log("====================================");
      console.log(`Server running on port ${PORT}`);
      console.log("Local uploads enabled");
      console.log("AWS S3 image fallback enabled");
      console.log("====================================");
    });
  } catch (error) {
    console.error("SERVER STARTUP ERROR:", error);
    process.exitCode = 1;
  }
};

startServer();