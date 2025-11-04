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

// Initialize AI Image Generator Service in Database
export const initializeAIImageGeneratorService = async () => {
  try {
    // Check if service already exists
    const existingService = await Service.findOne({
      type: "ai_image_generator",
    });
    if (existingService) {
      console.log("✅ AI Image Generator service already exists");
      return existingService;
    }

    // Create new service
    const service = new Service({
      name: "AI Image Generator",
      type: "ai_image_generator",
      description:
        "Generate high-quality images from text prompts using DALL·E 3",
      category: "AI Content Generation",

      // API Configuration
      apiConfig: {
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY || "sk-your-openai-api-key",
        baseUrl: "https://api.openai.com/v1",
        endpoints: {
          generate: "images/generations",
          status: "models",
        },
      },

      // Service Status
      status: "active",

      // Usage Limits
      limits: {
        dailyRequests: 50,
        monthlyRequests: 1500,
        maxImagesPerRequest: 1, // DALL·E 3 supports 1 image per request
      },

      // Pricing
      pricing: {
        free: {
          imagesPerDay: 3,
          requestsPerDay: 3,
        },
        paid: {
          imagesPerDay: 100,
          requestsPerDay: 100,
        },
      },

      // Features
      features: [
        "Multiple provider support (Pollinations, Qwen, Stability AI, Hugging Face, DALL·E 3)",
        "Multiple image sizes",
        "HD quality option",
        "8 style options (vivid, natural, realistic, artistic, anime, 3d-render, oil-painting, watercolor)",
        "Prompt revision",
        "High-quality image generation",
        "Free tier support for development",
        "Permanent image storage",
      ],

      // Statistics
      statistics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalImages: 0,
        averageResponseTime: 0,
      },

      // Configuration
      config: {
        defaultModel: "dall-e-3",
        defaultSize: "1024x1024",
        defaultQuality: "standard",
        defaultStyle: "vivid",
        timeout: 60000, // 60 seconds
      },
    });

    await service.save();
    console.log("✅ AI Image Generator service created successfully");
    return service;
  } catch (error) {
    console.error("❌ Error creating AI Image Generator service:", error);
    throw error;
  }
};
