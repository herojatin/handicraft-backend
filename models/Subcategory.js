import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({

  category: {
    type: String,
    required: true,
  },

  subcategory: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    default: "Active",
  },

}, {
  timestamps: true,
});

const Subcategory = mongoose.model(
  "Subcategory",
  subcategorySchema
);

export default Subcategory;