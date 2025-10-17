// src/services/payment/stripe.js
import Stripe from "stripe";

// Lazy-loaded Stripe client
let stripe = null;

// Initialize Stripe client when needed
const getStripeClient = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

export const createCustomer = async (userData) => {
  try {
    const stripeClient = getStripeClient();
    const customer = await stripeClient.customers.create({
      email: userData.email,
      name: userData.name,
      metadata: {
        userId: userData.id,
      },
    });
    return customer;
  } catch (error) {
    throw new Error(`Stripe Customer Creation Error: ${error.message}`);
  }
};

export const createSubscription = async (customerId, priceId) => {
  try {
    const stripeClient = getStripeClient();
    const subscription = await stripeClient.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
    return subscription;
  } catch (error) {
    throw new Error(`Stripe Subscription Error: ${error.message}`);
  }
};

export const handleWebhook = async (payload, signature) => {
  try {
    const stripeClient = getStripeClient();
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    throw new Error(`Webhook Error: ${error.message}`);
  }
};
