import express from "express";
import { getInstagramPosts } from "../controllers/instagramController.js";

const router = express.Router();

router.get("/", getInstagramPosts);

export default router;