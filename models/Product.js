
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      unique: true,
      sparse: true,
    },

    productCode: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      trim: true,
    },

    // Category.serial_id
    category_serial_id: {
      type: Number,
    },

    // Selected subcategory name
    subCategory: {
      type: String,
      trim: true,
      default: "",
    },

    // Subcategory.subcategory_serial_id
    subcategory_serial_id: {
      type: Number,
      default: 0,
    },

    length: {
      type: Number,
      default: 0,
    },

    width: {
      type: Number,
      default: 0,
    },

    height: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    // 1 = Active, 0 = Deactive
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },

    images: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
