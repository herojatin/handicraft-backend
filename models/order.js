import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  products: [
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  customerName: String,
  phone: String,
  address: String,
  totalPrice: Number,
  status: {
    type: String,
    default: "pending"
  }
});

export default mongoose.model("Order", orderSchema);