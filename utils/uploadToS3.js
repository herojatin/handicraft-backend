import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import s3 from "../config/s3.js";

const uploadToS3 = async (file, folder = "products") => {
  const extension = path.extname(file.originalname).toLowerCase();

  const fileName = `${folder}/${randomUUID()}${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return fileName;
};

export default uploadToS3;