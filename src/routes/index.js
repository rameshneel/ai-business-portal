import express from "express";
import authRoutes from "./auth.routes.js";
import serviceRoutes from "./service.routes.js";
import socketRoutes from "./socket.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import paymentRoutes from "./payment.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = express.Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/services", serviceRoutes);
router.use("/socket", socketRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/payment", paymentRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
