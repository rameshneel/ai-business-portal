import SubscriptionPlan from "../../models/subscriptionPlan.model.js";

// Initialize default subscription plans
export const initializeSubscriptionPlans = async () => {
  try {
    console.log("🔄 Initializing subscription plans...");

    // Check if plans already exist
    const existingPlans = await SubscriptionPlan.countDocuments();
    if (existingPlans > 0) {
      console.log("✅ Subscription plans already exist");
      return;
    }

    // Create default plans
    const defaultPlans = [
      {
        name: "free",
        displayName: "Free Plan",
        description:
          "Perfect for trying out our AI services with basic features - Always free!",
        price: {
          monthly: 0,
          yearly: 0,
          currency: "USD",
        },
        type: "free",
        features: {
          aiTextWriter: {
            wordsPerDay: 500,
            requestsPerDay: 10,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 3,
            requestsPerDay: 3,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 10,
            requestsPerDay: 10,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 1,
            messagesPerDay: 20,
            enabled: true,
          },
          prioritySupport: false,
          apiAccess: false,
          customBranding: false,
          analytics: false,
        },
        status: "active",
        displayOrder: 1,
        isPopular: false,
      },
      {
        name: "basic",
        displayName: "Basic Plan",
        description:
          "Perfect for individuals and small teams getting started with AI",
        price: {
          monthly: 9.99,
          yearly: 99.99,
          currency: "USD",
        },
        type: "basic",
        features: {
          aiTextWriter: {
            wordsPerDay: 10000,
            requestsPerDay: 100,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 50,
            requestsPerDay: 50,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 200,
            requestsPerDay: 200,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 5,
            messagesPerDay: 1000,
            enabled: true,
          },
          prioritySupport: true,
          apiAccess: true,
          customBranding: false,
          analytics: true,
        },
        status: "active",
        displayOrder: 2,
        isPopular: true,
      },
      {
        name: "pro",
        displayName: "Pro Plan",
        description: "Advanced features for growing businesses and power users",
        price: {
          monthly: 29.99,
          yearly: 299.99,
          currency: "USD",
        },
        type: "pro",
        features: {
          aiTextWriter: {
            wordsPerDay: 50000,
            requestsPerDay: 500,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 150,
            requestsPerDay: 150,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 500,
            requestsPerDay: 500,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 10,
            messagesPerDay: 3000,
            enabled: true,
          },
          prioritySupport: true,
          apiAccess: true,
          customBranding: true,
          analytics: true,
        },
        status: "active",
        displayOrder: 3,
        isPopular: false,
      },
      {
        name: "enterprise",
        displayName: "Enterprise Plan",
        description:
          "Unlimited access with premium support and custom branding",
        price: {
          monthly: 99.99,
          yearly: 999.99,
          currency: "USD",
        },
        type: "enterprise",
        features: {
          aiTextWriter: {
            wordsPerDay: 999999999,
            requestsPerDay: 999999999,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 999999999,
            requestsPerDay: 999999999,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 999999999,
            requestsPerDay: 999999999,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 999999999,
            messagesPerDay: 999999999,
            enabled: true,
          },
          prioritySupport: true,
          apiAccess: true,
          customBranding: true,
          analytics: true,
        },
        status: "active",
        displayOrder: 4,
        isPopular: false,
      },
    ];

    // Insert all plans
    await SubscriptionPlan.insertMany(defaultPlans);

    console.log("✅ Default subscription plans created successfully");
    console.log(`📊 Created ${defaultPlans.length} subscription plans:`);
    defaultPlans.forEach((plan) => {
      console.log(`   - ${plan.displayName}: $${plan.price.monthly}/month`);
    });
  } catch (error) {
    console.error("❌ Error creating subscription plans:", error);
    throw error;
  }
};
