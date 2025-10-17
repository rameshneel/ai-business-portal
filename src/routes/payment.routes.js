import express from "express";
import {
  createStripeCustomer,
  createStripeSubscription,
  handleStripeWebhook,
  getPaymentMethods,
  cancelStripeSubscription,
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validateSubscriptionUpgrade } from "../validation/subscription.validation.js";

const router = express.Router();

// ========================================
// PAYMENT MANAGEMENT ROUTES
// ========================================

// Create Stripe customer
router.post("/customer/create", verifyJWT, createStripeCustomer);

// Create Stripe subscription
router.post(
  "/subscription/create",
  verifyJWT,
  validateSubscriptionUpgrade,
  createStripeSubscription
);

// Get payment methods
router.get("/methods", verifyJWT, getPaymentMethods);

// Cancel Stripe subscription
router.post("/subscription/cancel", verifyJWT, cancelStripeSubscription);

// ========================================
// STRIPE WEBHOOK ROUTES
// ========================================

// Handle Stripe webhooks (no auth required - uses signature verification)
router.post("/webhook", handleStripeWebhook);

export default router;
