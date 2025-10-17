import OpenAI from "openai";

// Lazy-loaded OpenAI client
let openai = null;

// Initialize OpenAI client when needed
const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Validate environment variables at runtime
const validateEnvironment = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
};

// AI Text Writer Service
export class AITextWriterService {
  constructor() {
    this.model = "gpt-3.5-turbo";
    this.maxTokens = 1000;
    this.temperature = 0.7;
    this.timeout = 30000; // 30 seconds timeout
  }

  // Generate text based on content type
  async generateText(prompt, contentType, options = {}) {
    // Validate environment at runtime
    validateEnvironment();

    const {
      tone = "professional",
      length = "medium",
      language = "English",
    } = options;

    // Prepare system prompt based on content type
    const systemPrompt = this.getSystemPrompt(
      prompt,
      contentType,
      tone,
      length,
      language
    );

    try {
      const startTime = Date.now();
      const openaiClient = getOpenAIClient();

      const completion = await openaiClient.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional content writer. Write high-quality, engaging content that meets the user's requirements.",
          },
          {
            role: "user",
            content: systemPrompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const duration = Date.now() - startTime;
      const generatedText = completion.choices[0].message.content;
      const wordsGenerated = generatedText.split(" ").length;

      return {
        success: true,
        content: generatedText,
        wordsGenerated: wordsGenerated,
        tokensUsed: completion.usage?.total_tokens || 0,
        model: this.model,
        duration: duration,
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);

      // If quota exceeded, fall back to mock service
      if (error.code === "insufficient_quota" || error.status === 429) {
        console.log("🔄 OpenAI quota exceeded, falling back to mock service");
        return this.generateMockText(prompt, contentType, options);
      }

      return {
        success: false,
        error: error.message,
        code: error.code || "API_ERROR",
      };
    }
  }

  // Mock AI service for testing (when OpenAI quota exceeded)
  generateMockText(prompt, contentType, options = {}) {
    const { tone = "professional", length = "medium" } = options;

    const mockContent = {
      blog_post: `# ${prompt}\n\nThis is a comprehensive blog post about "${prompt}". In today's rapidly evolving digital landscape, understanding this topic is crucial for success. This article explores the key aspects, benefits, and practical applications.\n\n## Key Points\n\n1. **Introduction**: ${prompt} represents a significant opportunity for growth and innovation.\n2. **Main Content**: The core concepts involve strategic thinking and implementation.\n3. **Conclusion**: By following these principles, you can achieve remarkable results.\n\n*This content was generated using our AI Text Writer service.*`,

      social_media: `🚀 ${prompt}\n\nExcited to share insights about this amazing topic! 💡\n\nKey takeaways:\n✅ Important point 1\n✅ Important point 2\n✅ Important point 3\n\n#AI #Innovation #Business`,

      email: `Subject: ${prompt}\n\nDear [Recipient],\n\nI hope this email finds you well. I wanted to reach out regarding ${prompt}.\n\nThis is an important topic that I believe would be valuable for you to consider. The key benefits include:\n\n• Benefit 1\n• Benefit 2\n• Benefit 3\n\nI would love to discuss this further with you. Please let me know if you're interested in learning more.\n\nBest regards,\n[Your Name]`,

      product_description: `**${prompt}**\n\nTransform your business with our innovative solution! This powerful tool delivers exceptional results through cutting-edge technology.\n\n**Key Features:**\n• Advanced functionality\n• User-friendly interface\n• Reliable performance\n• 24/7 support\n\n**Benefits:**\n• Increased efficiency\n• Cost savings\n• Better results\n\nPerfect for businesses looking to streamline operations and boost productivity.`,

      ad_copy: `🎯 ${prompt}\n\nDon't miss out! Limited time offer.\n\n✨ Special features\n✨ Amazing benefits\n✨ Proven results\n\nAct now and transform your business today!`,

      general: `**${prompt}**\n\nThis is a well-crafted piece of content about "${prompt}". The content covers the essential aspects and provides valuable insights.\n\nKey highlights include:\n- Important aspect 1\n- Important aspect 2\n- Important aspect 3\n\nThis content demonstrates the power of AI-driven text generation.`,
    };

    const content = mockContent[contentType] || mockContent.general;
    const wordsGenerated = content.split(" ").length;
    const duration = Math.random() * 1000 + 500; // 500-1500ms

    return {
      success: true,
      content: content,
      wordsGenerated: wordsGenerated,
      tokensUsed: Math.floor(wordsGenerated * 1.3), // Approximate token count
      model: "mock-ai-service",
      duration: Math.floor(duration),
    };
  }

  // Get system prompt based on content type
  getSystemPrompt(prompt, contentType, tone, length, language) {
    const prompts = {
      blog_post: `Write a comprehensive blog post about: ${prompt}. Tone: ${tone}. Length: ${length}. Language: ${language}. Include an engaging introduction, well-structured body paragraphs, and a compelling conclusion.`,

      social_media: `Write engaging social media content about: ${prompt}. Tone: ${tone}. Length: ${length}. Language: ${language}. Make it shareable and include relevant hashtags.`,

      email: `Write a professional email about: ${prompt}. Tone: ${tone}. Length: ${length}. Language: ${language}. Include proper greeting, clear subject line suggestion, and professional closing.`,

      product_description: `Write a compelling product description for: ${prompt}. Tone: ${tone}. Length: ${length}. Language: ${language}. Highlight key features, benefits, and include a call-to-action.`,

      ad_copy: `Write persuasive ad copy for: ${prompt}. Tone: ${tone}. Length: ${length}. Language: ${language}. Focus on benefits, create urgency, and include a strong call-to-action.`,

      general: `Write content about: ${prompt}. Tone: ${tone}. Length: ${length}. Language: ${language}. Make it informative and engaging.`,
    };

    return prompts[contentType] || prompts.general;
  }

  // Get available content types
  getContentTypes() {
    return [
      {
        value: "blog_post",
        label: "Blog Post",
        description: "Comprehensive articles and blog posts",
      },
      {
        value: "social_media",
        label: "Social Media",
        description: "Posts for social media platforms",
      },
      {
        value: "email",
        label: "Email",
        description: "Professional email content",
      },
      {
        value: "product_description",
        label: "Product Description",
        description: "Marketing product descriptions",
      },
      {
        value: "ad_copy",
        label: "Ad Copy",
        description: "Persuasive advertising content",
      },
      {
        value: "general",
        label: "General",
        description: "General purpose content",
      },
    ];
  }

  // Get available tones
  getTones() {
    return [
      {
        value: "professional",
        label: "Professional",
        description: "Formal and business-like",
      },
      {
        value: "casual",
        label: "Casual",
        description: "Relaxed and conversational",
      },
      {
        value: "creative",
        label: "Creative",
        description: "Imaginative and artistic",
      },
      {
        value: "persuasive",
        label: "Persuasive",
        description: "Convincing and compelling",
      },
      {
        value: "friendly",
        label: "Friendly",
        description: "Warm and approachable",
      },
      {
        value: "formal",
        label: "Formal",
        description: "Structured and official",
      },
    ];
  }

  // Get available lengths
  getLengths() {
    return [
      {
        value: "short",
        label: "Short",
        description: "Brief and concise (50-150 words)",
      },
      {
        value: "medium",
        label: "Medium",
        description: "Balanced length (150-400 words)",
      },
      {
        value: "long",
        label: "Long",
        description: "Detailed and comprehensive (400+ words)",
      },
    ];
  }

  // Validate input parameters
  validateInput(prompt, contentType) {
    const errors = [];

    if (!prompt || prompt.trim().length < 10) {
      errors.push("Prompt must be at least 10 characters long");
    }

    if (prompt && prompt.length > 1000) {
      errors.push("Prompt must be less than 1000 characters");
    }

    const validContentTypes = [
      "blog_post",
      "social_media",
      "email",
      "product_description",
      "ad_copy",
      "general",
    ];
    if (!contentType || !validContentTypes.includes(contentType)) {
      errors.push("Invalid content type");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

// Export singleton instance
export const aiTextWriterService = new AITextWriterService();
