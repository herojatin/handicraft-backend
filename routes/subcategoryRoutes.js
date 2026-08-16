import express from "express";

import Subcategory from "../models/Subcategory.js";

const router = express.Router();


// ================= ADD SUBCATEGORY =================

router.post("/", async (req, res) => {

  try {

    const { category, subcategory, status } = req.body;

    const newSubcategory = new Subcategory({
      category,
      subcategory,
      status,
    });

    await newSubcategory.save();

    res.status(201).json({
      message: "Subcategory Added Successfully",
      newSubcategory,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
});


// ================= GET SUBCATEGORY BY CATEGORY =================

router.get("/:category", async (req, res) => {
  
  try {

   const subcategories = await Subcategory.find({
  category: {
    $regex: new RegExp(`^${req.params.category}$`, "i"),
  },
});
   

    res.json(subcategories);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
});

export default router;