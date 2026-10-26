
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import nodemailer from "nodemailer";

import Order from "../models/order.js";
import Dealer from "../models/dealerModel.js";

// =====================================================
// HELPERS
// =====================================================

const normalizeEmail = (email) =>
  email ? String(email).trim().toLowerCase() : "";

const isObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(String(id || "")) &&
  String(id).length === 24;

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map(safeString).join(", ");
    }

    return String(
      value.name || value.productCode || ""
    );
  }

  return String(value);
};

// Prevent Excel formula injection from dealer text.
const excelText = (value) => {
  const text = safeString(value);

  if (/^\s*[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
};

const resolveProductId = (item) => {
  const rawId =
    item.productId?._id ||
    item.productId ||
    item._id ||
    item.id ||
    item.product?._id ||
    item.product?.id;

  if (!rawId || !isObjectId(rawId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(
    String(rawId)
  );
};

const getAuthenticatedDealer = async (req) => {
  const authDealer =
    req.dealer || req.user || req.auth || null;

  if (!authDealer) return null;

  const dealerId =
    authDealer._id ||
    authDealer.id ||
    authDealer.dealerId;

  if (dealerId && isObjectId(dealerId)) {
    const dealer = await Dealer.findById(dealerId);

    if (dealer) return dealer;
  }

  const email =
    authDealer.email || authDealer.dealerEmail;

  if (email) {
    return Dealer.findOne({
      email: normalizeEmail(email),
    });
  }

  return null;
};

// =====================================================
// EXCEL GENERATOR
// =====================================================

export const generateOrderExcel = async (
  order,
  isAdmin = false
) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Haswani Handicrafts";
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const sheet = workbook.addWorksheet("Enquiry");

  const headers = [
    "S.No",
    "Product Code",
    "Product Name",
    "Category",
    "Sub Category",
    "Quantity",
    "Length",
    "Width",
    "Height",
    "CBM",
    "Product Question",
  ];

  if (isAdmin) {
    headers.push("Unit Price", "Total Price");
  }

  const columnCount = headers.length;

  const widths = [
    9, 20, 30, 20, 22, 14,
    14, 14, 14, 14, 45,
  ];

  if (isAdmin) {
    widths.push(18, 20);
  }

  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  // ===================================================
  // EXCEL HEADER
  // ===================================================

  sheet.mergeCells(1, 1, 1, columnCount);

  const titleCell = sheet.getCell("A1");

  titleCell.value =
    "HASWANI HANDICRAFTS - PRODUCT ENQUIRY";

  titleCell.font = {
    bold: true,
    size: 16,
    color: { argb: "FFFFFFFF" },
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF765333" },
  };

  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  sheet.getRow(1).height = 35;

  // ===================================================
  // ORDER DETAILS
  // ===================================================

  const details = [
    ["Order ID", order.orderId || String(order._id)],
    ["Dealer Name", order.dealerName || "-"],
    ["Company", order.dealerCompany || "-"],
    ["Email", order.dealerEmail || "-"],
    ["Mobile", order.dealerMobile || "-"],
    [
      "Order Date",
      order.createdAt
        ? new Date(order.createdAt).toLocaleDateString(
            "en-GB"
          )
        : "-",
    ],
    ["Status", order.status || "Pending"],
    [
      "General Enquiry Question",
      order.enquiryQuestion ||
        "No question submitted",
    ],
  ];

  details.forEach(([label, value], index) => {
    const rowNumber = index + 3;

    sheet.getCell(rowNumber, 1).value = label;

    sheet.getCell(rowNumber, 1).font = {
      bold: true,
      color: { argb: "FF765333" },
    };

    sheet.mergeCells(
      rowNumber,
      2,
      rowNumber,
      columnCount
    );

    const valueCell = sheet.getCell(rowNumber, 2);

    valueCell.value = excelText(value);

    valueCell.alignment = {
      vertical: "middle",
      wrapText: true,
    };

    sheet.getRow(rowNumber).height =
      index === 7 ? 55 : 23;
  });

  // ===================================================
  // PRODUCT TABLE HEADER
  // ===================================================

  const headerRowNumber = 13;
  const headerRow = sheet.getRow(headerRowNumber);

  headers.forEach((heading, index) => {
    const cell = headerRow.getCell(index + 1);

    cell.value = heading;

    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB18152" },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    cell.border = {
      bottom: {
        style: "medium",
        color: { argb: "FF765333" },
      },
    };
  });

  headerRow.height = 35;

  // ===================================================
  // PRODUCT ROWS
  // ===================================================

  const items = order.items || [];

  items.forEach((item, index) => {
    const rowNumber =
      headerRowNumber + index + 1;

    const quantity = Number(item.quantity || 0);

    const values = [
      index + 1,
      excelText(item.productCode),
      excelText(item.productName || item.name),
      excelText(item.category),
      excelText(item.subCategory),
      quantity,
      excelText(
        item.length ?? item.size?.length
      ),
      excelText(
        item.width ?? item.size?.width
      ),
      excelText(
        item.height ?? item.size?.height
      ),
      Number(
        item.cbm ?? item.size?.cbm ?? 0
      ),
      excelText(item.question || item.comment),
    ];

    if (isAdmin) {
      // Admin manually enters unit price.
      values.push(null);

      // F = Quantity
      // L = Unit Price
      // M = Total Price

      values.push({
        formula: `IF(L${rowNumber}="","",F${rowNumber}*L${rowNumber})`,
      });
    }

    const row = sheet.getRow(rowNumber);

    values.forEach((value, columnIndex) => {
      const cell = row.getCell(
        columnIndex + 1
      );

      cell.value = value;

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    row.height = 45;

    if (isAdmin) {
      const priceCell = row.getCell(12);

      priceCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF2CC" },
      };

      priceCell.numFmt = "#,##0.00";

      row.getCell(13).numFmt = "#,##0.00";
    }
  });

  // ===================================================
  // TOTALS
  // ===================================================

  const totalRowNumber =
    headerRowNumber + items.length + 2;

  sheet.getCell(totalRowNumber, 5).value =
    "TOTAL QUANTITY";

  sheet.getCell(totalRowNumber, 5).font = {
    bold: true,
  };

  sheet.getCell(totalRowNumber, 6).value =
    Number(order.totalQuantity || 0);

  sheet.getCell(totalRowNumber, 6).font = {
    bold: true,
  };

  if (isAdmin && items.length > 0) {
    sheet.getCell(totalRowNumber, 12).value =
      "GRAND TOTAL";

    sheet.getCell(totalRowNumber, 12).font = {
      bold: true,
    };

    const firstRow = headerRowNumber + 1;
    const lastRow =
      headerRowNumber + items.length;

    const totalCell = sheet.getCell(
      totalRowNumber,
      13
    );

    totalCell.value = {
      formula: `IF(COUNT(L${firstRow}:L${lastRow})=0,"",SUM(M${firstRow}:M${lastRow}))`,
    };

    totalCell.numFmt = "#,##0.00";
    totalCell.font = { bold: true };
  }

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowNumber,
    },
  ];

  return workbook.xlsx.writeBuffer();
};

// =====================================================
// CREATE ORDER - DEALER
// =====================================================

export const createOrder = async (req, res) => {
  try {
    const {
      cart,
      items: bodyItems,
      enquiryQuestion = "",
    } = req.body;

    const rawCartData = cart || bodyItems;

    // =================================================
    // VALIDATE CART
    // =================================================

    if (
      !Array.isArray(rawCartData) ||
      rawCartData.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Cart items cannot be empty.",
      });
    }

    if (
      typeof enquiryQuestion !== "string" ||
      enquiryQuestion.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enquiry question must be text under 2000 characters.",
      });
    }

    // =================================================
    // AUTHENTICATE DEALER
    // =================================================

    const dealer =
      await getAuthenticatedDealer(req);

    if (!dealer) {
      return res.status(401).json({
        success: false,
        message:
          "Dealer authentication required. Please login again.",
      });
    }

    const dealerEmail =
      normalizeEmail(dealer.email);

    const dealerName = [
      dealer.firstName,
      dealer.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const dealerMobile =
      dealer.mobile || dealer.phone || "";

    const dealerCompany =
      dealer.companyName || "";

    const generatedOrderId =
      `ORD-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    // =================================================
    // FORMAT ORDER ITEMS
    // =================================================

    const formattedItems = rawCartData.map(
      (item) => {
        const productId =
          resolveProductId(item);

        if (!productId) {
          const error = new Error(
            `Invalid product ID for product ${
              item.productCode || "Unknown"
            }.`
          );

          error.statusCode = 400;
          throw error;
        }

        const quantity =
          Number(item.quantity);

        if (
          !Number.isSafeInteger(quantity) ||
          quantity < 1
        ) {
          const error = new Error(
            `Invalid quantity for product ${
              item.productCode || "Unknown"
            }.`
          );

          error.statusCode = 400;
          throw error;
        }

        const image =
          item.image ||
          item.imageUrl ||
          (Array.isArray(item.images)
            ? item.images[0]
            : item.images) ||
          "";

        const imageString =
          typeof image === "string"
            ? image
            : image?.url ||
              image?.path ||
              "";

        return {
          productId,

          productCode: safeString(
            item.productCode || item.code
          ),

          productName: safeString(
            item.productName ||
              item.name ||
              item.description ||
              "Product"
          ),

          quantity,

          // Dealer cannot set pricing.
          price: 0,

          image: imageString,

          category: safeString(
            item.category
          ),

          subCategory: safeString(
            item.subCategory
          ),

          length: safeString(
            item.length ??
              item.size?.length
          ),

          width: safeString(
            item.width ??
              item.size?.width
          ),

          height: safeString(
            item.height ??
              item.size?.height
          ),

          cbm:
            Number(
              item.cbm ??
                item.size?.cbm ??
                0
            ) || 0,

          comment: safeString(
            item.question ||
              item.comment ||
              item.note
          ),
        };
      }
    );

    const totalQuantity =
      formattedItems.reduce(
        (total, item) =>
          total + item.quantity,
        0
      );

    // =================================================
    // SAVE ORDER TO DATABASE
    // =================================================

    const newOrder = new Order({
      orderId: generatedOrderId,

      dealer: dealer._id,
      dealerName,
      dealerEmail,
      dealerMobile,
      dealerCompany,

      items: formattedItems,
      totalQuantity,

      enquiryQuestion:
        enquiryQuestion.trim(),

      status: "Pending",
    });

    const savedOrder =
      await newOrder.save();

    // =================================================
    // SEND ADMIN EMAIL
    // =================================================
    // Email failure must NOT make the saved order fail.
    // =================================================

    try {
      const emailUser =
        process.env.EMAIL_USER;

      const emailPassword =
        process.env.EMAIL_PASS;

      const adminEmail =
        process.env.ADMIN_EMAIL ||
        "info@haswanihandicrafts.com";

      if (!emailUser || !emailPassword) {
        console.error(
          "ORDER EMAIL ERROR: Email credentials are missing. Enquiry was saved."
        );
      } else {
        const transporter =
          nodemailer.createTransport({
            service: "gmail",

            auth: {
              user: emailUser,
              pass: emailPassword,
            },
          });

        const excelBuffer =
          await generateOrderExcel(
            savedOrder,
            true
          );

        await transporter.sendMail({
          from: emailUser,
          to: adminEmail,

          subject:
            `New Dealer Enquiry - ${savedOrder.orderId}`,

          text: `
New Dealer Enquiry Received

Order ID: ${savedOrder.orderId}

Dealer Name: ${dealerName}
Company: ${dealerCompany}
Email: ${dealerEmail}
Mobile: ${dealerMobile}

Total Products: ${formattedItems.length}
Total Quantity: ${totalQuantity}

General Enquiry Question:
${savedOrder.enquiryQuestion || "No question submitted"}

The complete enquiry Excel file is attached.
          `.trim(),

          attachments: [
            {
              filename:
                `Enquiry-${savedOrder.orderId}.xlsx`,

              content: excelBuffer,

              contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          ],
        });

        console.log(
          `Admin enquiry email sent for ${savedOrder.orderId}`
        );
      }
    } catch (emailError) {
      // Log email failure only in backend.
      // Do not send it as an error to the dealer.

      console.error(
        "ORDER EMAIL ERROR:",
        emailError
      );
    }

    // =================================================
    // SUCCESS RESPONSE
    // =================================================
    // Order was saved successfully.
    // Email delivery does not change this result.
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Query sent successfully.",
      order: savedOrder,
    });

  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to create order.",
      });
  }
};

// =====================================================
// GET DEALER ORDERS
// =====================================================

export const getDealerOrders = async (
  req,
  res
) => {
  try {
    const dealer =
      await getAuthenticatedDealer(req);

    if (!dealer) {
      return res.status(401).json({
        success: false,
        message:
          "Dealer authentication required.",
      });
    }

    const orders = await Order.find({
      dealer: dealer._id,
    })
      .populate(
        "items.productId",
        "productCode name images"
      )
      .sort({ createdAt: -1 });

    // Hide pricing fields from dealers.

    const safeOrders = orders.map(
      (order) => {
        const data = order.toObject();

        data.items = (
          data.items || []
        ).map((item) => {
          delete item.price;
          delete item.unitPrice;
          delete item.totalPrice;

          return item;
        });

        return data;
      }
    );

    return res.status(200).json({
      success: true,
      count: safeOrders.length,
      orders: safeOrders,
    });
  } catch (error) {
    console.error(
      "GET DEALER ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch dealer orders.",
    });
  }
};

// =====================================================
// GET ALL ORDERS - ADMIN
// =====================================================

export const getOrders = async (
  req,
  res
) => {
  try {
    const orders = await Order.find()
      .populate(
        "dealer",
        "firstName lastName email companyName mobile"
      )
      .populate(
        "items.productId",
        "productCode name images"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "GET ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch orders.",
    });
  }
};

// =====================================================
// GET SINGLE ORDER - ADMIN
// =====================================================

export const getOrderById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(id)
      .populate(
        "dealer",
        "firstName lastName email companyName mobile"
      )
      .populate(
        "items.productId",
        "productCode name images"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch order.",
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS - ADMIN
// =====================================================

export const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    if (!isObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const updatedOrder =
      await Order.findByIdAndUpdate(
        id,
        { status },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update order status.",
    });
  }
};

// Delete order functionality is intentionally omitted to prevent accidental deletion of orders.


export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed orders can be deleted.",
      });
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete order.",
    });
  }
};


// =====================================================
// DOWNLOAD ORDER EXCEL - ADMIN / DEALER
// =====================================================

export const downloadOrderExcel = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const role = req.excelRole;

    if (!["admin", "dealer"].includes(role)) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized Excel download.",
      });
    }

    if (!isObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Dealer can download only their own order.

    if (role === "dealer") {
      const dealer =
        await getAuthenticatedDealer(req);

      if (
        !dealer ||
        String(order.dealer) !==
          String(dealer._id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot download this order.",
        });
      }
    }

    const isAdmin = role === "admin";

    const excelBuffer =
      await generateOrderExcel(
        order,
        isAdmin
      );

    const safeOrderId = String(
      order.orderId || order._id
    ).replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

    const filename =
      `Enquiry-${safeOrderId}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    return res.send(
      Buffer.from(excelBuffer)
    );
  } catch (error) {
    console.error(
      "DOWNLOAD ORDER EXCEL ERROR:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Failed to generate Excel file.",
      });
    }

    return res.end();
  }
};
