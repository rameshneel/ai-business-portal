import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createCustomer,
  createSubscription,
  handleWebhook,
} from "../services/payment/stripe.js";
import Subscription from "../models/subscription.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import User from "../models/user.model.js";

// Create Stripe customer
export const createStripeCustomer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const customer = await createCustomer({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      id: userId,
    });

    // Update user with Stripe customer ID
    user.stripeCustomerId = customer.id;
    await user.save();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          customerId: customer.id,
          email: customer.email,
        },
        "Stripe customer created successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to create Stripe customer: ${error.message}`
    );
  }
});

// Create Stripe subscription
export const createStripeSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { planId, billingCycle = "monthly" } = req.body;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const user = await User.findById(userId);
  const plan = await SubscriptionPlan.findById(planId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!plan) {
    throw new ApiError(404, "Subscription plan not found");
  }

  if (plan.type === "free" || plan.type === "trial") {
    throw new ApiError(
      400,
      "Cannot create Stripe subscription for free or trial plans"
    );
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await createCustomer({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      id: userId,
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  // Get Stripe price ID based on billing cycle
  const priceId =
    billingCycle === "yearly"
      ? plan.stripe.priceIdYearly
      : plan.stripe.priceIdMonthly;

  if (!priceId) {
    throw new ApiError(
      400,
      `Stripe price ID not configured for ${billingCycle} billing`
    );
  }

  try {
    const subscription = await createSubscription(customerId, priceId);

    // Create subscription record in database
    const subscriptionData = {
      userId: userId,
      planId: plan._id,
      plan: plan.type,
      status: "pending", // Will be updated via webhook
      billingCycle: billingCycle,
      amount:
        billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly,
      currency: plan.price.currency,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      limits: plan.features,
      features: plan.features,
      usage: {
        wordsUsed: 0,
        imagesUsed: 0,
        minutesUsed: 0,
        charactersUsed: 0,
        pagesUsed: 0,
        chatbotsUsed: 0,
        voiceClonesUsed: 0,
        lastResetDate: new Date(),
      },
    };

    const newSubscription = new Subscription(subscriptionData);
    await newSubscription.save();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          subscriptionId: subscription.id,
          clientSecret:
            subscription.latest_invoice.payment_intent.client_secret,
          status: subscription.status,
          plan: plan.type,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
        },
        "Stripe subscription created successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to create Stripe subscription: ${error.message}`
    );
  }
});

// Handle Stripe webhooks
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const payload = req.body;

  try {
    const event = await handleWebhook(payload, signature);

    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    throw new ApiError(
      400,
      `Webhook signature verification failed: ${error.message}`
    );
  }
});

// Webhook handlers
const handleSubscriptionCreated = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (subscription) {
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(
      stripeSubscription.current_period_start * 1000
    );
    subscription.currentPeriodEnd = new Date(
      stripeSubscription.current_period_end * 1000
    );
    await subscription.save();
  }
};

const handleSubscriptionUpdated = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (subscription) {
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(
      stripeSubscription.current_period_start * 1000
    );
    subscription.currentPeriodEnd = new Date(
      stripeSubscription.current_period_end * 1000
    );
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    await subscription.save();
  }
};

const handleSubscriptionDeleted = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (subscription) {
    subscription.status = "cancelled";
    await subscription.save();
  }
};

const handlePaymentSucceeded = async (invoice) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (subscription) {
    subscription.status = "active";
    await subscription.save();
  }
};

const handlePaymentFailed = async (invoice) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (subscription) {
    subscription.status = "past_due";
    await subscription.save();
  }
};

// Get payment methods
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user || !user.stripeCustomerId) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { paymentMethods: [] }, "No payment methods found")
      );
  }

  // This would require additional Stripe API calls
  // For now, return empty array
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { paymentMethods: [] },
        "Payment methods retrieved successfully"
      )
    );
});

// Cancel subscription
export const cancelStripeSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const subscription = await Subscription.findOne({ userId });

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new ApiError(404, "No active Stripe subscription found");
  }

  try {
    // Cancel subscription in Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update subscription status
    subscription.status = "cancelled";
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscriptionId: subscription.stripeSubscriptionId,
          status: subscription.status,
        },
        "Subscription cancelled successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, `Failed to cancel subscription: ${error.message}`);
  }
});
