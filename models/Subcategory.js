
import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    // Existing category reference
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },

    // Relation with Category.serial_id
    category_serial_id: {
      type: Number,
      required: true,
      index: true,
    },

    subcategory: {
      type: String,
      required: true,
      trim: true,
    },

    // 1 = Active, 0 = Deactive
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },

    product_serial_id: {
      type: Number,
      default: 0,
    },

    subcategory_serial_id: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Subcategory = mongoose.model(
  "Subcategory",
  subcategorySchema
);

export default Subcategory;
