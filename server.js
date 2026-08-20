import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subcategoryRoutes from "./routes/subcategoryRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import dealerRoutes from "./routes/dealerRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";
import catalogueCategoryRoutes from "./routes/catalogueCategoryRoutes.js";
import catalogueProductRoutes from "./routes/catalogueProductRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import Dealer from "./models/dealerModel.js";

import Admin from "./models/Admin.js";

dotenv.config();

const app = express();

// =====================================================
// PATH
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// STATIC UPLOADS
// =====================================================

// This serves:
// backend/uploads/image.jpg
//
// through:
// http://localhost:5000/uploads/image.jpg

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/events",
  eventRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/subcategories",
  subcategoryRoutes
);

app.use(
  "/api/vendors",
  vendorRoutes
);

app.use(
  "/api/admins",
  adminRoutes
);

app.use(
  "/api/testimonials",
  testimonialRoutes
);

app.use(
  "/api/contact",
  contactRoutes
);

app.use(
  "/api/dealers",
  dealerRoutes
);

app.use(
  "/api/instagram",
  instagramRoutes
);

app.use(
  "/api/catalogue/categories",
  catalogueCategoryRoutes
);

app.use(
  "/api/catalogue/products",
  catalogueProductRoutes
);

app.use("/api/enquiry", enquiryRoutes);

// =====================================================
// DEFAULT SUPER ADMIN
// =====================================================

const createAdmin = async () => {
  try {
    const exists = await Admin.findOne({
      email: "admin@haswani.com",
    });

    if (!exists) {
      const hashedPassword =
        await bcrypt.hash(
          "123456",
          10
        );

      await Admin.create({
        name: "Super Admin",
        email: "admin@haswani.com",
        password: hashedPassword,
        role: "superadmin",
      });

      console.log(
        "Default Super Admin Created"
      );
    }
  } catch (error) {
    console.log(
      "Admin Creation Error:",
      error
    );
  }
};

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
  try {
    await connectDB();

    await createAdmin();

    app.listen(5000, () => {
      console.log(
        "Server running on port 5000"
      );
    });
  } catch (error) {
    console.log(
      "Server startup error:",
      error
    );
  }
};

startServer();