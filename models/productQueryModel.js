import mongoose from "mongoose";

const productQuerySchema = new mongoose.Schema(
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

    question: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductQuery = mongoose.model(
  "ProductQuery",
  productQuerySchema
);

export default ProductQuery;