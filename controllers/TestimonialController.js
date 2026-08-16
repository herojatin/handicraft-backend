import Testimonial from "../models/Testimonial.js";


/* ==============================
   GET ALL TESTIMONIALS
================================= */

export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({
      createdAt: -1,
    });

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//test



/* ==============================
   CUSTOMER SUBMIT TESTIMONIAL
================================= */

export const createTestimonial = async (req, res) => {
  try {
    const { name, city, rating, message } = req.body;

    const testimonial = await Testimonial.create({
      name,
      city,
      rating,
      message,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Testimonial submitted successfully.",
      testimonial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   GET APPROVED TESTIMONIALS
================================= */

export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      status: "approved",
    }).sort({ createdAt: -1 });

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ==============================
   GET PENDING TESTIMONIALS
================================= */

export const getPendingTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      status: "pending",
    }).sort({ createdAt: -1 });

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ==============================
   APPROVE
================================= */

export const approveTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
      },
      {
        new: true,
      }
    );

    if (!testimonial) {
      return res.status(404).json({
        message: "Testimonial not found.",
      });
    }

    res.json({
      success: true,
      message: "Testimonial approved.",
      testimonial,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ==============================
   REJECT
================================= */

export const rejectTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
      },
      {
        new: true,
      }
    );

    res.json(testimonial);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


export const restoreTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        status: "pending",
      },
      {
        new: true,
      }
    );

    if (!testimonial) {
      return res.status(404).json({
        message: "Testimonial not found",
      });
    }

    res.json({
      success: true,
      message: "Testimonial restored successfully.",
      testimonial,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ==============================
   DELETE
================================= */

export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        message: "Testimonial not found.",
      });
    }

    await testimonial.deleteOne();

    res.json({
      success: true,
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};