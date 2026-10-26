
import mongoose from "mongoose";

// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productCode: {
      type: String,
      default: "",
      trim: true,
    },

    productName: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Admin pricing field
    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
    },

    subCategory: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    // =================================================
    // PRODUCT DIMENSIONS
    // =================================================

    length: {
      type: String,
      default: "",
    },

    width: {
      type: String,
      default: "",
    },

    height: {
      type: String,
      default: "",
    },

    cbm: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =================================================
    // PRODUCT-SPECIFIC QUESTION
    // =================================================

    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// MAIN ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
      trim: true,
    },

    // =================================================
    // DEALER INFORMATION
    // =================================================

    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: [true, "Dealer reference is required"],
    },

    dealerName: {
      type: String,
      default: "",
      trim: true,
    },

    dealerEmail: {
      type: String,
      required: [true, "Dealer email is required"],
      trim: true,
      lowercase: true,
    },

    dealerMobile: {
      type: String,
      default: "",
      trim: true,
    },

    dealerCompany: {
      type: String,
      default: "",
      trim: true,
    },

    // =================================================
    // ORDER PRODUCTS
    // =================================================

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length > 0,

        message: "Order items array cannot be empty",
      },
    },

    totalQuantity: {
      type: Number,
      required: [true, "Total quantity is required"],
      min: 1,
    },

    // =================================================
    // GENERAL ENQUIRY QUESTION
    // =================================================

    enquiryQuestion: {
      type: String,
      default: "",
      trim: true,
      maxlength: [
        2000,
        "Enquiry question cannot exceed 2000 characters",
      ],
    },

    // =================================================
    // ORDER STATUS
    // =================================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

// Faster dealer order lookup
orderSchema.index({
  dealer: 1,
  createdAt: -1,
});

// Faster admin order listing
orderSchema.index({
  createdAt: -1,
});

// =====================================================
// EXPORT MODEL
// =====================================================

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;
