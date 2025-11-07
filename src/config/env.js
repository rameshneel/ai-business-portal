import dotenv from "dotenv";
import logger from "../utils/logger.js";

// Load environment variables FIRST
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  "MONGODB_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];

// Optional environment variables with defaults
const optionalEnvVars = {
  PORT: 5000,
  NODE_ENV: "development",
  EMBEDDING_PROVIDER: "openai",
  CHAT_PROVIDER: "openai",
  TEXT_WRITER_PROVIDER: "openrouter", // Text Writer provider: 'openai', 'openrouter', or 'ollama'
  OLLAMA_TEXT_WRITER_MODEL: "mistral:7b", // Ollama model for text writer
  RATE_LIMIT_WINDOW_MS: "900000", // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: "100",
  FRONTEND_URL: "http://localhost:3000",
};

// Validate required environment variables
const missingVars = [];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  const errorMessage = `❌ Missing required environment variables: ${missingVars.join(
    ", "
  )}\nPlease check your .env file.`;
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

// Set defaults for optional variables
Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
  if (!process.env[key]) {
    process.env[key] = defaultValue;
    logger.debug(`Using default value for ${key}: ${defaultValue}`);
  }
});

// Log configuration (without sensitive data)
if (process.env.NODE_ENV !== "production") {
  logger.info("Environment Configuration:", {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
    CHAT_PROVIDER: process.env.CHAT_PROVIDER,
    TEXT_WRITER_PROVIDER: process.env.TEXT_WRITER_PROVIDER,
    OLLAMA_TEXT_WRITER_MODEL: process.env.OLLAMA_TEXT_WRITER_MODEL,
    MONGODB_URI: process.env.MONGODB_URI ? "✓ Set" : "✗ Missing",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
      ? "✓ Set"
      : "✗ Missing",
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET
      ? "✓ Set"
      : "✗ Missing",
  });
}

export default process.env;
