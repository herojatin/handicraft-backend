import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema(
  {
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
  },
  { _id: false }
);

const catalogueProductSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      unique: true,
      required: true,
    },

    productCode: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Shared Category
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Shared Subcategories
    subCategory: [
      {
        type: String,
        trim: true,
      },
    ],

    // Multiple Sizes
    sizes: [sizeSchema],

    quantity: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Deactive"],
      default: "Active",
    },

    // Multiple Images
    images: [
      {
        type: String,
      },
    ],

    createdBy: {
      type: String,
      required: true,
    },

    updatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "CatalogueProduct",
  catalogueProductSchema
);