import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

mongoose.connect("mongodb://127.0.0.1:27017/haswani");

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);

    await Admin.create({
      email: "admin@gmail.com",
      password: hashedPassword,
    });

    console.log("Admin created successfully");
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

createAdmin();