import ProductQuery from "../models/productQueryModel.js";

export const createProductQuery = async (req, res) => {
  try {
    const {
      productId,
      productCode,
      question,
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const productQuery = await ProductQuery.create({
      productId,
      productCode: productCode || "",
      question: question.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Your question has been sent to the admin.",
      query: productQuery,
    });
  } catch (error) {
    console.error(
      "CREATE PRODUCT QUERY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit your question.",
      error: error.message,
    });
  }
};