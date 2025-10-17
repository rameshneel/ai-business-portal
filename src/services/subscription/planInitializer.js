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
          "Perfect for trying out our AI services with basic features",
        price: {
          monthly: 0,
          yearly: 0,
          currency: "USD",
        },
        type: "free",
        features: {
          aiTextWriter: {
            wordsPerDay: 0,
            requestsPerDay: 0,
            enabled: false,
          },
          aiImageGenerator: {
            imagesPerDay: 0,
            requestsPerDay: 0,
            enabled: false,
          },
          aiSearch: {
            searchesPerDay: 0,
            requestsPerDay: 0,
            enabled: false,
          },
          aiChatbot: {
            chatbotsPerAccount: 0,
            messagesPerDay: 0,
            enabled: false,
          },
          prioritySupport: false,
          apiAccess: false,
          customBranding: false,
          analytics: false,
        },
        trial: {
          enabled: false,
          durationDays: 0,
          features: {},
        },
        status: "active",
        displayOrder: 1,
        isPopular: false,
      },
      {
        name: "trial",
        displayName: "7-Day Trial",
        description:
          "Experience all our AI services with generous limits for 7 days",
        price: {
          monthly: 0,
          yearly: 0,
          currency: "USD",
        },
        type: "trial",
        features: {
          aiTextWriter: {
            wordsPerDay: 1000,
            requestsPerDay: 10,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 5,
            requestsPerDay: 5,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 20,
            requestsPerDay: 20,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 1,
            messagesPerDay: 50,
            enabled: true,
          },
          prioritySupport: false,
          apiAccess: false,
          customBranding: false,
          analytics: false,
        },
        trial: {
          enabled: true,
          durationDays: 7,
          features: {
            aiTextWriter: {
              wordsPerDay: 1000,
              requestsPerDay: 10,
            },
            aiImageGenerator: {
              imagesPerDay: 5,
              requestsPerDay: 5,
            },
          },
        },
        status: "active",
        displayOrder: 2,
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
            wordsPerDay: 5000,
            requestsPerDay: 50,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 20,
            requestsPerDay: 20,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 100,
            requestsPerDay: 100,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 3,
            messagesPerDay: 200,
            enabled: true,
          },
          prioritySupport: false,
          apiAccess: false,
          customBranding: false,
          analytics: true,
        },
        trial: {
          enabled: false,
          durationDays: 0,
          features: {},
        },
        status: "active",
        displayOrder: 3,
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
            wordsPerDay: 20000,
            requestsPerDay: 200,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 100,
            requestsPerDay: 100,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 500,
            requestsPerDay: 500,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 10,
            messagesPerDay: 1000,
            enabled: true,
          },
          prioritySupport: true,
          apiAccess: true,
          customBranding: false,
          analytics: true,
        },
        trial: {
          enabled: false,
          durationDays: 0,
          features: {},
        },
        status: "active",
        displayOrder: 4,
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
            wordsPerDay: 100000,
            requestsPerDay: 1000,
            enabled: true,
          },
          aiImageGenerator: {
            imagesPerDay: 500,
            requestsPerDay: 500,
            enabled: true,
          },
          aiSearch: {
            searchesPerDay: 2000,
            requestsPerDay: 2000,
            enabled: true,
          },
          aiChatbot: {
            chatbotsPerAccount: 50,
            messagesPerDay: 5000,
            enabled: true,
          },
          prioritySupport: true,
          apiAccess: true,
          customBranding: true,
          analytics: true,
        },
        trial: {
          enabled: false,
          durationDays: 0,
          features: {},
        },
        status: "active",
        displayOrder: 5,
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
