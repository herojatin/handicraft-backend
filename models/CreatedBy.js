const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      unique: true,
    },
    productCode: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: [
      {
        type: String,
      },
    ],
    sizes: [
      {
        length: Number,
        width: Number,
        height: Number,
      },
    ],
    quantity: Number,
    description: String,
    status: {
      type: String,
      enum: ["Active", "Deactive"],
      default: "Active",
    },
    images: [String],

    // NEW FIELD
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
  type: String,
  default: "",
},
  },
  {
    timestamps: true,
  }
);