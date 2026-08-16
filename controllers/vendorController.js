import Vendor from "../models/Vendor.js";


// ================= GET ALL VENDORS =================

export const getVendors = async (req, res) => {
  try {

    const vendors = await Vendor.find()
      .sort({ createdAt: -1 });

    res.json(vendors);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


// ================= UPDATE VENDOR =================

export const updateVendor = async (req, res) => {
  try {

    const vendor =
      await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    Object.keys(req.body).forEach((key) => {
      vendor[key] = req.body[key];
    });

    const updatedVendor =
      await vendor.save();

    res.json(updatedVendor);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


// ================= DELETE VENDOR =================

export const deleteVendor = async (req, res) => {
  try {

    const vendor =
      await Vendor.findByIdAndDelete(
        req.params.id
      );

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    res.json({
      message: "Vendor deleted",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};