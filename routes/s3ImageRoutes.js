import express from "express";
import path from "path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

const router = express.Router();

// ==========================================
// GET IMAGE FROM AWS S3
// ==========================================

router.get("/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;

    if (
      !filename ||
      filename === "." ||
      filename === ".." ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const key = `uploads/${filename}`;

    console.log("IMAGE REQUEST:", filename);
    console.log("S3 KEY:", key);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);

    // Determine image MIME type
    const extension = path.extname(filename).toLowerCase();

    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".avif": "image/avif",
    };

    const contentType =
      mimeTypes[extension] ||
      response.ContentType ||
      "application/octet-stream";

    // Force browser to display image instead of downloading
    res.setHeader("Content-Type", contentType);

    res.setHeader(
      "Content-Disposition",
      "inline"
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=3600"
    );

    if (response.ContentLength !== undefined) {
      res.setHeader(
        "Content-Length",
        response.ContentLength
      );
    }

    if (!response.Body) {
      return res.status(404).json({
        success: false,
        message: "Image body is empty",
      });
    }

    response.Body.on("error", (error) => {
      console.error("S3 STREAM ERROR:", error);
      res.destroy(error);
    });

    response.Body.pipe(res);

  } catch (error) {
    console.error("S3 IMAGE ERROR:", {
      name: error.name,
      message: error.message,
    });

    if (res.headersSent) {
      return res.destroy(error);
    }

    if (
      error.name === "NoSuchKey" ||
      error.name === "NotFound"
    ) {
      return res.status(404).json({
        success: false,
        message: "Image not found in AWS S3",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve image",
      error: error.name,
    });
  }
});

export default router;