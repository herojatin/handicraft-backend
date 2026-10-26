import FAQ from "../models/faqModel.js";

// =====================================================
// GET ALL FAQs
// =====================================================

export const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find()
      .populate(
        "dealer",
        "firstName lastName email mobile companyName"
      )
      .populate(
        "productId",
        "name productCode images"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error("Get FAQs Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// CREATE FAQ QUESTION
// =====================================================

export const createFAQ = async (req, res) => {
  try {
    const {
      productId,
      productCode,
      productName,
      productImage,

      dealer,
      dealerName,
      dealerEmail,
      dealerCompany,

      question,
    } = req.body;

    // -------------------------------------------------
    // VALIDATE QUESTION
    // -------------------------------------------------

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    // -------------------------------------------------
    // CREATE FAQ
    // -------------------------------------------------

    const faq = await FAQ.create({
      productId: productId || null,

      productCode: productCode || "",

      productName: productName || "",

      productImage: productImage || "",

      dealer: dealer || null,

      dealerName: dealerName || "",

      dealerEmail: dealerEmail || "",

      dealerCompany: dealerCompany || "",

      question: question.trim(),

      answer: "",
    });

    return res.status(201).json({
      success: true,
      message:
        "Your question has been sent to the admin.",
      faq,
    });
  } catch (error) {
    console.error("Create FAQ Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// ANSWER / UPDATE FAQ
// =====================================================

export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const { answer } = req.body;

    // -------------------------------------------------
    // FIND FAQ
    // -------------------------------------------------

    const faq = await FAQ.findById(id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found.",
      });
    }

    // -------------------------------------------------
    // VALIDATE ANSWER
    // -------------------------------------------------

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: "Answer is required.",
      });
    }

    // -------------------------------------------------
    // SAVE ANSWER
    // -------------------------------------------------

    faq.answer = answer.trim();

    await faq.save();

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully.",
      faq,
    });
  } catch (error) {
    console.error("Update FAQ Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// DELETE FAQ
// =====================================================

export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------
    // FIND FAQ
    // -------------------------------------------------

    const faq = await FAQ.findById(id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found.",
      });
    }

    // -------------------------------------------------
    // DELETE FAQ
    // -------------------------------------------------

    await FAQ.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    console.error("Delete FAQ Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};