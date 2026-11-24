
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI?.trim();

    if (!uri) {
      throw new Error("MONGO_URI is missing from the .env file");
    }

    if (
      !uri.startsWith("mongodb://") &&
      !uri.startsWith("mongodb+srv://")
    ) {
      throw new Error("Invalid MongoDB connection string");
    }

    const conn = await mongoose.connect(uri);

    console.log("MongoDB Connected Successfully");
    console.log("Database:", conn.connection.name);
    console.log("Host:", conn.connection.host);
    console.log("Connection State:", conn.connection.readyState);

  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
