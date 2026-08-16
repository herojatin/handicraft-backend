import express from "express";
import ExcelJS from "exceljs";
import nodemailer from "nodemailer";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Helper for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post("/send", async (req, res) => {
  try {
    const { cart, orderId = `ORDER #${Date.now().toString(16)}` } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // 1. Create a new Excel Workbook & Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Enquiry Order");

    // Enable grid lines
    worksheet.views = [{ showGridLines: true }];

    // Define column definitions
    worksheet.columns = [
      { key: "code", width: 15 },
      { key: "image", width: 20 },
      { key: "venderEmail", width: 32 },
      { key: "description", width: 35 },
      { key: "qty", width: 8 },
      { key: "length", width: 22 },
      { key: "width", width: 22 },
      { key: "height", width: 22 },
      { key: "cbm", width: 14 },
      { key: "cbmTotal", width: 14 },
      { key: "comment", width: 25 },
      { key: "price", width: 15 },
    ];

    // 2. Title Row (Row 2)
    worksheet.mergeCells("A2:L2");
    const titleCell = worksheet.getCell("A2");
    titleCell.value = orderId;
    titleCell.font = { name: "Arial", size: 16, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // 3. Table Header Row (Row 3)
    const headerRow = worksheet.addRow([
      "CODE",
      "IMAGE",
      "Vender Email",
      "DESCRIPTION",
      "QTY",
      "Length (cm)",
      "Width (cm)",
      "Height (cm)",
      "CBM",
      "CBM Total",
      "COMMENT",
      "Price",
    ]);

    headerRow.font = { name: "Arial", size: 11, bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    let totalQty = 0;

    // 4. Populate Product Data Rows
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const qty = Number(item.quantity || 1);
      totalQty += qty;

      const size = item.sizes?.[0] || {};
      const lCm = size.length || "-";
      const wCm = size.width || "-";
      const hCm = size.height || "-";

      const lIn = lCm !== "-" ? (Number(lCm) / 2.54).toFixed(2) : "-";
      const wIn = wCm !== "-" ? (Number(wCm) / 2.54).toFixed(2) : "-";
      const hIn = hCm !== "-" ? (Number(hCm) / 2.54).toFixed(2) : "-";

      const lengthStr = lCm !== "-" ? `${lCm}(Cm)/${lIn}(Inch)` : "-";
      const widthStr = wCm !== "-" ? `${wCm}(Cm)/${wIn}(Inch)` : "-";
      const heightStr = hCm !== "-" ? `${hCm}(Cm)/${hIn}(Inch)` : "-";

      let cbm = 0;
      if (lCm !== "-" && wCm !== "-" && hCm !== "-") {
        cbm = Number((lCm * wCm * hCm) / 1000000);
      }
      const cbmFormatted = cbm ? cbm.toFixed(6) : "-";
      const cbmTotalFormatted = cbm ? (cbm * qty).toFixed(6) : "-";

      const dataRow = worksheet.addRow([
        item.productCode || item.code || "-",
        "", 
        item.venderEmail || "haswani.factory@gmail.com",
        (item.description || item.name || "").toUpperCase(),
        qty,
        lengthStr,
        widthStr,
        heightStr,
        cbmFormatted,
        cbmTotalFormatted,
        item.comment || "",
        item.price ? `₹${item.price}` : "",
      ]);

      const rowIndex = dataRow.number;
      worksheet.getRow(rowIndex).height = 65;

      dataRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      dataRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
      dataRow.getCell(5).alignment = { vertical: "middle", horizontal: "center" };

      // Image embedding optimization
      try {
        let rawImage = item.image || item.images?.[0];

        if (rawImage && typeof rawImage === "string") {
          let imageBuffer = null;
          let ext = "png";

          if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
            const response = await axios.get(rawImage, { responseType: "arraybuffer" });
            imageBuffer = Buffer.from(response.data);
            ext = rawImage.split(".").pop().split(/[?#]/)[0].toLowerCase() || "png";
          } else {
            // Local file reading from uploads folder
            const cleanPath = rawImage.replace(/^uploads[\\/]/, "").replace(/^\/+/, "");
            const localFilePath = path.join(__dirname, "../uploads", cleanPath); // Adjust path relative to route folder

            if (fs.existsSync(localFilePath)) {
              imageBuffer = fs.readFileSync(localFilePath);
              ext = path.extname(localFilePath).replace(".", "").toLowerCase() || "png";
            }
          }

          if (imageBuffer) {
            const validExts = ["jpeg", "png", "gif"];
            const imageExt = validExts.includes(ext) ? (ext === "jpg" ? "jpeg" : ext) : "png";

            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: imageExt,
            });

            worksheet.addImage(imageId, {
              tl: { col: 1, row: rowIndex - 1 },
              ext: { width: 75, height: 75 },
              editAs: "oneCell",
            });
          }
        }
      } catch (err) {
        console.error(`Failed to embed image for item ${item.productCode}:`, err.message);
      }
    }

    // 5. Total Row
    const totalRow = worksheet.addRow([
      "Total",
      "",
      "",
      "",
      totalQty,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    totalRow.font = { name: "Arial", size: 11, bold: true };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 6. Write Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 7. Nodemailer Transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "YOUR_GMAIL_ADDRESS@gmail.com",
        pass: process.env.EMAIL_PASS || "YOUR_GMAIL_APP_PASSWORD",
      },
    });

    const mailOptions = {
      from: `"Enquiry System" <${process.env.EMAIL_USER || "YOUR_GMAIL_ADDRESS@gmail.com"}>`,
      to: "admin@example.com",
      subject: `New Cart Enquiry - ${orderId}`,
      text: `Hello Admin,\n\nA new enquiry order has been submitted.\n\nTotal Items: ${cart.length}\nTotal Quantity: ${totalQty}`,
      attachments: [
        {
          filename: `Enquiry_${orderId.replace("#", "").trim()}.xlsx`,
          content: buffer,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Enquiry sent successfully to admin email!",
    });
  } catch (error) {
    console.error("Error sending enquiry email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Excel or send email.",
    });
  }
});

export default router;