import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Trial from "../models/trial.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

// Check trial expiration and send notifications
export const checkTrialExpiration = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const trial = await Trial.findOne({ userId, status: "active" });
  if (!trial) {
    throw new ApiError(404, "No active trial found");
  }

  const now = new Date();
  const daysRemaining = Math.ceil(
    (trial.endTime - now) / (1000 * 60 * 60 * 24)
  );
  const hoursRemaining = Math.ceil((trial.endTime - now) / (1000 * 60 * 60));

  // Emit trial expiration warning
  if (req.socketIO) {
    let message = "";
    let urgency = "info";

    if (daysRemaining <= 0) {
      message =
        "🚨 Your trial has expired! Subscribe now to continue using our services.";
      urgency = "error";
    } else if (daysRemaining === 1) {
      message =
        "⚠️ Your trial expires tomorrow! Don't lose access to our AI services.";
      urgency = "warning";
    } else if (daysRemaining <= 3) {
      message = `⏰ Your trial expires in ${daysRemaining} days. Upgrade now for uninterrupted access.`;
      urgency = "warning";
    } else {
      message = `📅 Your trial expires in ${daysRemaining} days.`;
      urgency = "info";
    }

    req.socketIO.emitToUser(userId, "trial_expiration_warning", {
      trial: {
        id: trial._id,
        endTime: trial.endTime,
        daysRemaining: daysRemaining,
        hoursRemaining: hoursRemaining,
        isExpired: daysRemaining <= 0,
      },
      message: message,
      urgency: urgency,
      timestamp: new Date(),
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        trial: {
          id: trial._id,
          endTime: trial.endTime,
          daysRemaining: daysRemaining,
          hoursRemaining: hoursRemaining,
          isExpired: daysRemaining <= 0,
        },
        message:
          daysRemaining <= 0
            ? "Trial has expired"
            : `Trial expires in ${daysRemaining} days`,
      },
      "Trial expiration status retrieved successfully"
    )
  );
});

// Get subscription status with real-time updates
export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({ userId }).populate(
    "planId",
    "name displayName type features price"
  );

  const trial = await Trial.findOne({ userId, status: "active" });

  const isActive = subscription && subscription.isActive();
  const hasActiveTrial = trial && trial.isActive();

  // Emit subscription status update
  if (req.socketIO) {
    req.socketIO.emitToUser(userId, "subscription_status_update", {
      subscription: subscription
        ? {
            id: subscription._id,
            plan: subscription.plan,
            planDetails: subscription.planId,
            status: subscription.status,
            isActive: isActive,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      trial: trial
        ? {
            id: trial._id,
            status: trial.status,
            endTime: trial.endTime,
            isActive: hasActiveTrial,
            daysRemaining: Math.ceil(
              (trial.endTime - new Date()) / (1000 * 60 * 60 * 24)
            ),
          }
        : null,
      hasActiveAccess: isActive || hasActiveTrial,
      timestamp: new Date(),
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscription: subscription
          ? {
              id: subscription._id,
              plan: subscription.plan,
              planDetails: subscription.planId,
              status: subscription.status,
              isActive: isActive,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
          : null,
        trial: trial
          ? {
              id: trial._id,
              status: trial.status,
              endTime: trial.endTime,
              isActive: hasActiveTrial,
              daysRemaining: Math.ceil(
                (trial.endTime - new Date()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
        hasActiveAccess: isActive || hasActiveTrial,
      },
      "Subscription status retrieved successfully"
    )
  );
});

// Send upgrade prompt notification
export const sendUpgradePrompt = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reason, service } = req.body;

  if (!req.socketIO) {
    throw new ApiError(503, "Socket.IO service not available");
  }

  const subscription = await Subscription.findOne({ userId }).populate(
    "planId",
    "name displayName type"
  );

  const trial = await Trial.findOne({ userId, status: "active" });

  let message = "";
  let urgency = "info";

  switch (reason) {
    case "limit_reached":
      message = `🚫 You've reached your ${service} limit. Upgrade to continue using our AI services.`;
      urgency = "warning";
      break;
    case "trial_expiring":
      message =
        "⏰ Your trial is expiring soon! Upgrade now to keep using our services.";
      urgency = "warning";
      break;
    case "feature_unavailable":
      message =
        "🔒 This feature is not available in your current plan. Upgrade to unlock it.";
      urgency = "info";
      break;
    default:
      message =
        "💡 Upgrade your plan to unlock more features and higher limits.";
      urgency = "info";
  }

  req.socketIO.emitToUser(userId, "upgrade_prompt", {
    reason: reason,
    service: service,
    message: message,
    urgency: urgency,
    currentPlan: subscription?.plan || trial?.status || "free",
    upgradeUrl: "/subscription/plans",
    timestamp: new Date(),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        message: "Upgrade prompt sent successfully",
        reason: reason,
        service: service,
      },
      "Upgrade prompt notification sent"
    )
  );
});
