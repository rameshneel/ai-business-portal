import express from "express";
import {
  generateText,
  getTextHistory,
  getUsageStats,
  getTextWriterOptions,
} from "../controllers/service.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validateTextGeneration } from "../validation/service.validation.js";

const router = express.Router();

// ========================================
// AI TEXT WRITER SERVICE ROUTES
// ========================================

// Generate AI Text
router.post("/text/generate", verifyJWT, validateTextGeneration, generateText);

// Get Text Generation History
router.get("/text/history", verifyJWT, getTextHistory);

// Get Service Options (Content Types, Tones, Lengths)
router.get("/text/options", verifyJWT, getTextWriterOptions);

// Get Usage Statistics
router.get("/text/usage", verifyJWT, getUsageStats);

export default router;
