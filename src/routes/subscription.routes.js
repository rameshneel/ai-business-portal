import express from "express";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  startTrial,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionUsage,
  getAllSubscriptions,
} from "../controllers/subscription.controller.js";
import {
  checkTrialExpiration,
  getSubscriptionStatus,
  sendUpgradePrompt,
} from "../controllers/subscriptionNotification.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";
import {
  validateSubscriptionUpgrade,
  validateUsageQuery,
  validateUpgradePrompt,
  validateSubscriptionQuery,
} from "../validation/subscription.validation.js";

const router = express.Router();

// ========================================
// SUBSCRIPTION MANAGEMENT ROUTES
// ========================================

// Get all available subscription plans (public)
router.get("/plans", getSubscriptionPlans);

// Get user's current subscription
router.get("/current", verifyJWT, getCurrentSubscription);

// Start a trial
router.post("/trial/start", verifyJWT, startTrial);

// Upgrade to paid subscription
router.post(
  "/upgrade",
  verifyJWT,
  validateSubscriptionUpgrade,
  upgradeSubscription
);

// Cancel subscription
router.post("/cancel", verifyJWT, cancelSubscription);

// Get subscription usage
router.get("/usage", verifyJWT, validateUsageQuery, getSubscriptionUsage);

// ========================================
// REAL-TIME NOTIFICATION ROUTES
// ========================================

// Check trial expiration with real-time notifications
router.get("/trial/expiration", verifyJWT, checkTrialExpiration);

// Get subscription status with real-time updates
router.get("/status", verifyJWT, getSubscriptionStatus);

// Send upgrade prompt notification
router.post(
  "/upgrade-prompt",
  verifyJWT,
  validateUpgradePrompt,
  sendUpgradePrompt
);

// ========================================
// ADMIN ROUTES
// ========================================

// Get all subscriptions (admin only)
router.get(
  "/admin/all",
  verifyJWT,
  adminOnly,
  validateSubscriptionQuery,
  getAllSubscriptions
);

export default router;
