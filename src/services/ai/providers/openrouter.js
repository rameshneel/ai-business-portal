// OpenRouter API Service
import OpenAI from "openai";

// Lazy-loaded OpenRouter client
let openrouter = null;

// Initialize OpenRouter client when needed
export const getOpenRouterClient = () => {
  if (!openrouter) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY environment variable is required");
    }

    // OpenRouter is OpenAI-compatible, uses same SDK
    openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5000",
        "X-Title": "AI Business Portal",
      },
    });
  }
  return openrouter;
};

// Get available models from OpenRouter
export const getOpenRouterModels = () => {
  return [
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description: "Latest Claude model with excellent reasoning",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      description: "OpenAI's flagship model",
    },
    {
      id: "google/gemini-pro",
      name: "Gemini Pro",
      description: "Google's advanced language model",
    },
    {
      id: "meta-llama/llama-3.1-70b-instruct",
      name: "Llama 3.1 70B",
      description: "Open source model by Meta",
    },
    {
      id: "mistralai/mixtral-8x7b-instruct",
      name: "Mixtral 8x7B",
      description: "High-quality open source model",
    },
  ];
};

// Default model for text generation
export const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";
