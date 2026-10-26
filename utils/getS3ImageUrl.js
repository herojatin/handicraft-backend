import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../config/s3.js";

export const getS3ImageUrl = async (imageKey) => {
  if (!imageKey || typeof imageKey !== "string") {
    return "";
  }

  try {
    const key = imageKey.trim().replace(/\\/g, "/");

    // Already a complete URL
    if (/^https?:\/\//i.test(key)) {
      return key;
    }

    // Old local uploads are not automatically stored in S3
    if (key.startsWith("uploads/") || key.startsWith("/uploads/")) {
      return "";
    }

    if (!process.env.AWS_S3_BUCKET_NAME) {
      console.error("AWS_S3_BUCKET_NAME is missing");
      return "";
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key.replace(/^\/+/, ""),
    });

    return await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("S3 IMAGE URL ERROR:", error.message);
    return "";
  }
};