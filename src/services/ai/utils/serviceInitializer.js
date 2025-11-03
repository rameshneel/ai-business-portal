import Service from "../../../models/service.model.js";

// Initialize AI Text Writer Service in Database
export const initializeAITextWriterService = async () => {
  try {
    // Check if service already exists
    const existingService = await Service.findOne({ type: "ai_text_writer" });
    if (existingService) {
      console.log("✅ AI Text Writer service already exists");
      return existingService;
    }

    // Create new service
    const service = new Service({
      name: "AI Text Writer",
      type: "ai_text_writer",
      description:
        "Generate high-quality text content using AI for blogs, social media, emails, and more",
      category: "AI Content Generation",

      // API Configuration
      apiConfig: {
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY || "sk-your-openai-api-key",
        baseUrl: "https://api.openai.com/v1",
        endpoints: {
          generate: "chat/completions",
          status: "models",
          webhook: "webhooks",
        },
      },

      // Service Status
      status: "active",

      // Usage Limits
      limits: {
        dailyRequests: 100,
        monthlyRequests: 3000,
        maxTokensPerRequest: 1000,
      },

      // Pricing
      pricing: {
        free: {
          wordsPerDay: 500,
          requestsPerDay: 10,
        },
        paid: {
          wordsPerDay: 10000,
          requestsPerDay: 100,
        },
      },

      // Features
      features: [
        "Blog post generation",
        "Social media content",
        "Email writing",
        "Product descriptions",
        "Ad copy creation",
        "Multiple content types",
        "Tone customization",
        "Length control",
        "Language support",
      ],

      // Statistics
      statistics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalUsage: 0,
        averageResponseTime: 0,
      },

      // Configuration
      config: {
        defaultModel: "gpt-3.5-turbo",
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
      },
    });

    await service.save();
    console.log("✅ AI Text Writer service created successfully");
    return service;
  } catch (error) {
    console.error("❌ Error creating AI Text Writer service:", error);
    throw error;
  }
};
