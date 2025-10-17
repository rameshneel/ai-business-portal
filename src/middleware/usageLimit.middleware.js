import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Subscription from "../models/subscription.model.js";
import Trial from "../models/trial.model.js";
import ServiceUsage from "../models/serviceUsage.model.js";

// Check if user has access to a specific service
export const checkServiceAccess = (serviceName) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    // Get user's subscription
    const subscription = await Subscription.findOne({ userId }).populate(
      "planId",
      "features"
    );

    // Get user's trial
    const trial = await Trial.findOne({ userId, status: "active" });

    // Check if user has access
    let hasAccess = false;
    let limits = {};

    if (subscription && subscription.isActive()) {
      // Check subscription access
      const plan = subscription.planId;
      if (plan && plan.features[serviceName]?.enabled) {
        hasAccess = true;
        limits = plan.features[serviceName];
      }
    } else if (trial && trial.isActive()) {
      // Check trial access
      if (trial.limits[serviceName]) {
        hasAccess = true;
        limits = trial.limits[serviceName];
      }
    }

    if (!hasAccess) {
      throw new ApiError(
        403,
        `Access to ${serviceName} service is not available in your current plan`
      );
    }

    // Attach limits to request
    req.serviceLimits = limits;
    req.subscription = subscription;
    req.trial = trial;

    next();
  });
};

// Check daily usage limits for a service
export const checkDailyUsageLimit = (serviceName, limitType) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const limits = req.serviceLimits;

    if (!limits || !limits[limitType]) {
      throw new ApiError(
        403,
        `No ${limitType} limit defined for ${serviceName}`
      );
    }

    const dailyLimit = limits[limitType];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's usage
    const todayUsage = await ServiceUsage.aggregate([
      {
        $match: {
          userId: userId,
          "request.type": serviceName,
          "request.timestamp": { $gte: today },
          "response.success": true,
        },
      },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: `$usage.${limitType}` },
        },
      },
    ]);

    const usedToday = todayUsage[0]?.totalUsage || 0;

    if (usedToday >= dailyLimit) {
      throw new ApiError(
        403,
        `Daily ${limitType} limit reached (${dailyLimit} ${limitType}/day)`
      );
    }

    // Attach usage info to request
    req.usageInfo = {
      usedToday: usedToday,
      dailyLimit: dailyLimit,
      remaining: dailyLimit - usedToday,
    };

    next();
  });
};

// Check if user can use AI Text Writer
export const checkTextWriterAccess = [
  checkServiceAccess("aiTextWriter"),
  checkDailyUsageLimit("ai_text_writer", "wordsGenerated"),
];

// Check if user can use AI Image Generator
export const checkImageGeneratorAccess = [
  checkServiceAccess("aiImageGenerator"),
  checkDailyUsageLimit("ai_image_generator", "imagesGenerated"),
];

// Check if user can use AI Search
export const checkSearchAccess = [
  checkServiceAccess("aiSearch"),
  checkDailyUsageLimit("ai_search", "searchesPerformed"),
];

// Check if user can use AI Chatbot
export const checkChatbotAccess = [
  checkServiceAccess("aiChatbot"),
  checkDailyUsageLimit("ai_chatbot", "messagesGenerated"),
];

// Generic usage limit checker
export const checkUsageLimit = (serviceName, limitType, limitValue) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's usage
    const todayUsage = await ServiceUsage.aggregate([
      {
        $match: {
          userId: userId,
          "request.type": serviceName,
          "request.timestamp": { $gte: today },
          "response.success": true,
        },
      },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: `$usage.${limitType}` },
        },
      },
    ]);

    const usedToday = todayUsage[0]?.totalUsage || 0;

    if (usedToday >= limitValue) {
      throw new ApiError(
        403,
        `Daily ${limitType} limit reached (${limitValue} ${limitType}/day)`
      );
    }

    req.usageInfo = {
      usedToday: usedToday,
      dailyLimit: limitValue,
      remaining: limitValue - usedToday,
    };

    next();
  });
};

// Check subscription status
export const checkSubscriptionStatus = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Get user's subscription
  const subscription = await Subscription.findOne({ userId });

  // Get user's trial
  const trial = await Trial.findOne({ userId, status: "active" });

  // Check if user has any active access
  const hasActiveSubscription = subscription && subscription.isActive();
  const hasActiveTrial = trial && trial.isActive();

  if (!hasActiveSubscription && !hasActiveTrial) {
    throw new ApiError(
      403,
      "No active subscription or trial found. Please start a trial or subscribe to a plan."
    );
  }

  req.subscription = subscription;
  req.trial = trial;
  req.hasActiveAccess = hasActiveSubscription || hasActiveTrial;

  next();
});

// Check if user is on trial and near expiration
export const checkTrialExpiration = asyncHandler(async (req, res, next) => {
  const trial = req.trial;

  if (trial && trial.isActive()) {
    const daysRemaining = Math.ceil(
      (trial.endTime - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 3) {
      // Add warning to response headers
      res.setHeader(
        "X-Trial-Warning",
        `Trial expires in ${daysRemaining} days`
      );
      res.setHeader("X-Trial-Expiry", trial.endTime.toISOString());
    }
  }

  next();
});
