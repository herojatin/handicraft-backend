import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
   

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
  type: String,
  enum: ["superadmin", "admin", "midadmin"],
  default: "midadmin",
},

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Admin", adminSchema);