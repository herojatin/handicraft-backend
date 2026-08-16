import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    image: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Active", "Deactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model(
  "Category",
  categorySchema
);

export default Category;