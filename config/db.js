import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is missing from the .env file");
    }

    if (
      !uri.startsWith("mongodb://") &&
      !uri.startsWith("mongodb+srv://")
    ) {
      throw new Error(
        "Invalid MONGO_URI. It must start with mongodb:// or mongodb+srv://"
      );
    }

    const conn = await mongoose.connect(uri);

    console.log("MongoDB Atlas Connected Successfully");
    console.log("Database:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;