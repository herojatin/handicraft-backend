import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    // =====================================================
    // PRODUCT DETAILS
    // =====================================================

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
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

    productImage: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // DEALER DETAILS
    // =====================================================

    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      default: null,
    },

    dealerName: {
      type: String,
      default: "",
      trim: true,
    },

    dealerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    dealerCompany: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // QUESTION / ANSWER
    // =====================================================

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const FAQ =
  mongoose.models.FAQ ||
  mongoose.model("FAQ", faqSchema);

export default FAQ;