import express from "express";

import {
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import s3 from "../config/s3.js";

const router = express.Router();

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
      return res.status(400).send("Invalid filename");
    }

    // Your existing S3 structure
    const key = `uploads/${filename}`;

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);

    // Send correct image content type
    res.setHeader(
      "Content-Type",
      response.ContentType || "image/jpeg"
    );

    res.setHeader(
      "Cache-Control",
      "public, max-age=3600"
    );

    // Stream image directly from S3
    response.Body.on("error", (error) => {
      console.error("S3 IMAGE STREAM ERROR:", error);
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
      return res.status(404).send("Image not found");
    }

    return res.status(500).send("Unable to load image");
  }
});

export default router;