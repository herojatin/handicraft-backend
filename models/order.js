import mongoose from "mongoose";

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
    },

    productName: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
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

    comment: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
      sparse: true,
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: [true, "Dealer reference is required"],
    },
    dealerEmail: {
      type: String,
      required: [true, "Dealer email is required"],
      trim: true,
      lowercase: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        "Order items array cannot be empty",
      ],
      required: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;