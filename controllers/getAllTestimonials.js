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