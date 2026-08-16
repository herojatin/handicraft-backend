import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      unique: true,
    },

    productCode: {
      type: String,
    },

    description: {
      type: String,
    },

    category: {
      type: String,
    },

    subCategory: {
      type: [String],
      default: [],
    },

    length: {
      type: String,
    },

    width: {
      type: String,
    },

    height: {
      type: String,
    },

    quantity: {
      type: Number,
    },

    status: {
      type: String,
      default: "Active",
    },

    images: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Product",
  productSchema
);