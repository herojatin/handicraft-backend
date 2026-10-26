import express from "express";

import {
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

import s3 from "../config/s3.js";

const router = express.Router();

router.get("/test-image", async (req, res) => {
  try {
    const key = "uploads/MO 04429.JPG";

    // Check whether the image exists in S3
    const result = await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
    );

    // Generate signed URL
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 3600 }
    );

    return res.json({
      success: true,
      message: "Image found in AWS S3",
      key,
      contentType: result.ContentType,
      imageUrl: signedUrl,
    });

  } catch (error) {
    console.error("S3 TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.name,
      message: error.message,
    });
  }
});

export default router;