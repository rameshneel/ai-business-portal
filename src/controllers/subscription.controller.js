import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Subscription from "../models/subscription.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import Trial from "../models/trial.model.js";
import User from "../models/user.model.js";
import {
  createDefaultUsage,
  createSubscriptionData,
  calculatePeriodEnd,
} from "../utils/subscriptionUtils.js";

// ========================================
// SUBSCRIPTION MANAGEMENT
// ========================================

// Get all available subscription plans
export const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.getActivePlans();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        plans: plans.map((plan) => ({
          id: plan._id,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          price: plan.price,
          type: plan.type,
          features: plan.features,
          trial: plan.trial,
          isPopular: plan.isPopular,
          displayOrder: plan.displayOrder,
        })),
        totalPlans: plans.length,
      },
      "Subscription plans retrieved successfully"
    )
  );
});

// Get user's current subscription
export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({ userId })
    .populate("planId", "name displayName type features price")
    .sort({ createdAt: -1 });

  if (!subscription) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscription: null,
          hasActiveSubscription: false,
          message: "No active subscription found",
        },
        "User subscription status retrieved"
      )
    );
  }

  const isActive = subscription.isActive();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          planDetails: subscription.planId,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          amount: subscription.amount,
          currency: subscription.currency,
          limits: subscription.limits,
          features: subscription.features,
          usage: subscription.usage,
          isActive: isActive,
        },
        hasActiveSubscription: isActive,
      },
      "User subscription retrieved successfully"
    )
  );
});

// Start a trial
export const startTrial = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Check if user already has an active trial
  const existingTrial = await Trial.findOne({
    userId,
    status: { $in: ["active", "expired"] },
  });

  if (existingTrial) {
    throw new ApiError(
      400,
      "User already has a trial. One trial per user allowed."
    );
  }

  // Get trial plan
  const trialPlan = await SubscriptionPlan.getTrialPlan();
  if (!trialPlan) {
    throw new ApiError(404, "Trial plan not found");
  }

  // Create trial
  const trial = new Trial({
    userId: userId,
    planId: trialPlan._id,
    startTime: new Date(),
    status: "active",
    limits: trialPlan.trial.features,
  });

  await trial.save();

  // Update user's subscription to trial
  const subscriptionData = createSubscriptionData(
    userId,
    trialPlan._id,
    { type: "trial" },
    "monthly",
    0,
    "USD",
    trialPlan.trial.features,
    trialPlan.features
  );

  // Override trial-specific dates
  subscriptionData.currentPeriodStart = trial.startTime;
  subscriptionData.currentPeriodEnd = trial.endTime;

  const subscription = new Subscription(subscriptionData);

  await subscription.save();

  // Emit trial start event
  if (req.socketIO) {
    req.socketIO.emitToUser(userId, "trial_started", {
      trial: {
        id: trial._id,
        startTime: trial.startTime,
        endTime: trial.endTime,
        remainingDays: Math.ceil(
          (trial.endTime - new Date()) / (1000 * 60 * 60 * 24)
        ),
        limits: trial.limits,
      },
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
      },
      timestamp: new Date(),
    });
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        trial: {
          id: trial._id,
          startTime: trial.startTime,
          endTime: trial.endTime,
          status: trial.status,
          limits: trial.limits,
          remainingDays: Math.ceil(
            (trial.endTime - new Date()) / (1000 * 60 * 60 * 24)
          ),
        },
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          limits: subscription.limits,
        },
      },
      "Trial started successfully"
    )
  );
});

// Upgrade to paid subscription
export const upgradeSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { planId, billingCycle = "monthly" } = req.body;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  // Get the plan
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Subscription plan not found");
  }

  if (plan.type === "free" || plan.type === "trial") {
    throw new ApiError(400, "Cannot upgrade to free or trial plan");
  }

  // Check if user has an active subscription
  const existingSubscription = await Subscription.findOne({ userId });

  if (existingSubscription && existingSubscription.isActive()) {
    throw new ApiError(400, "User already has an active subscription");
  }

  // Calculate pricing and period
  const amount =
    billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
  const currency = plan.price.currency;
  const periodEnd = calculatePeriodEnd(billingCycle);

  // Create or update subscription
  let subscription;
  if (existingSubscription) {
    // Update existing subscription
    subscription = await Subscription.findByIdAndUpdate(
      existingSubscription._id,
      {
        planId: plan._id,
        plan: plan.type,
        status: "active",
        billingCycle: billingCycle,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        amount: amount,
        currency: currency,
        limits: plan.features,
        features: plan.features,
        usage: createDefaultUsage(),
      },
      { new: true }
    );
  } else {
    // Create new subscription
    const subscriptionData = createSubscriptionData(
      userId,
      plan._id,
      plan,
      billingCycle,
      amount,
      currency,
      plan.features,
      plan.features
    );

    subscription = new Subscription(subscriptionData);
    await subscription.save();
  }

  // Update trial status if exists
  const trial = await Trial.findOne({ userId, status: "active" });
  if (trial) {
    trial.status = "converted";
    trial.conversion.converted = true;
    trial.conversion.convertedAt = now;
    trial.conversion.convertedTo = plan.type;
    await trial.save();
  }

  // Emit subscription upgrade event
  if (req.socketIO) {
    req.socketIO.emitToUser(userId, "subscription_upgraded", {
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        planDetails: plan,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      trial: trial
        ? {
            id: trial._id,
            status: trial.status,
            converted: trial.conversion.converted,
            convertedAt: trial.conversion.convertedAt,
          }
        : null,
      timestamp: new Date(),
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          planDetails: plan,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          amount: subscription.amount,
          currency: subscription.currency,
          limits: subscription.limits,
          features: subscription.features,
        },
        trial: trial
          ? {
              id: trial._id,
              status: trial.status,
              converted: trial.conversion.converted,
              convertedAt: trial.conversion.convertedAt,
            }
          : null,
      },
      "Subscription upgraded successfully"
    )
  );
});

// Cancel subscription
export const cancelSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({ userId });
  if (!subscription) {
    throw new ApiError(404, "No active subscription found");
  }

  if (!subscription.isActive()) {
    throw new ApiError(400, "Subscription is not active");
  }

  // Set to cancel at period end
  subscription.cancelAtPeriodEnd = true;
  await subscription.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscription: {
          id: subscription._id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      },
      "Subscription will be cancelled at the end of the current period"
    )
  );
});

// Get subscription usage
export const getSubscriptionUsage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({ userId }).populate(
    "planId",
    "name displayName features"
  );

  if (!subscription) {
    throw new ApiError(404, "No subscription found");
  }

  const plan = subscription.planId;
  const usage = subscription.usage;
  const limits = subscription.limits;

  // Calculate usage percentages
  const usageStats = {
    aiTextWriter: {
      wordsUsed: usage.wordsUsed || 0,
      wordsLimit: limits.aiTextWriter?.wordsPerDay || 0,
      wordsPercentage: limits.aiTextWriter?.wordsPerDay
        ? Math.round(
            ((usage.wordsUsed || 0) / limits.aiTextWriter.wordsPerDay) * 100
          )
        : 0,
      requestsUsed: 0, // This would need to be tracked separately
      requestsLimit: limits.aiTextWriter?.requestsPerDay || 0,
    },
    aiImageGenerator: {
      imagesUsed: usage.imagesUsed || 0,
      imagesLimit: limits.aiImageGenerator?.imagesPerDay || 0,
      imagesPercentage: limits.aiImageGenerator?.imagesPerDay
        ? Math.round(
            ((usage.imagesUsed || 0) / limits.aiImageGenerator.imagesPerDay) *
              100
          )
        : 0,
    },
    aiSearch: {
      searchesUsed: 0, // This would need to be tracked separately
      searchesLimit: limits.aiSearch?.searchesPerDay || 0,
      searchesPercentage: limits.aiSearch?.searchesPerDay
        ? Math.round((0 / limits.aiSearch.searchesPerDay) * 100)
        : 0,
    },
    aiChatbot: {
      chatbotsUsed: usage.chatbotsUsed || 0,
      chatbotsLimit: limits.aiChatbot?.chatbotsPerAccount || 0,
      chatbotsPercentage: limits.aiChatbot?.chatbotsPerAccount
        ? Math.round(
            ((usage.chatbotsUsed || 0) / limits.aiChatbot.chatbotsPerAccount) *
              100
          )
        : 0,
    },
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          planDetails: plan,
          status: subscription.status,
          isActive: subscription.isActive(),
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
        usage: usageStats,
        lastResetDate: usage.lastResetDate,
        nextResetDate: new Date(
          usage.lastResetDate.getTime() + 24 * 60 * 60 * 1000
        ),
      },
      "Subscription usage retrieved successfully"
    )
  );
});

// Admin: Get all subscriptions
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }

  const { page = 1, limit = 10, status, plan } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;
  if (plan) filter.plan = plan;

  const subscriptions = await Subscription.find(filter)
    .populate("userId", "firstName lastName email")
    .populate("planId", "name displayName type")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Subscription.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscriptions: subscriptions.map((sub) => ({
          id: sub._id,
          user: sub.userId,
          plan: sub.plan,
          planDetails: sub.planId,
          status: sub.status,
          billingCycle: sub.billingCycle,
          amount: sub.amount,
          currency: sub.currency,
          currentPeriodEnd: sub.currentPeriodEnd,
          createdAt: sub.createdAt,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSubscriptions: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      "All subscriptions retrieved successfully"
    )
  );
});
