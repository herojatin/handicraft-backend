import mongoose from "mongoose";
const vendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: Number,
      unique: true,
    },

    firstName: String,
    lastName: String,
    email: String,
    mobile: String,
    country: String,
    state: String,
    city: String,
    address: String,

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    membershipType: {
      type: String,
      enum: ["Lifetime", "Inactive"],
      default: "Lifetime",
    },

    expirationDate: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Vendor",
  vendorSchema
);