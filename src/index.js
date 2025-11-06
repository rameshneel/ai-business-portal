import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

// Setup PDF polyfills early (before any module imports pdf-parse)
import "./utils/pdfPolyfill.js";

import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/database.js";
import { initializeSocketIO } from "./services/communication/socketIOService.js";
import {
  initializeAITextWriterService,
  initializeAIImageGeneratorService,
  initializeAIChatbotBuilderService,
} from "./services/ai/utils/serviceInitializer.js";
import { initializeSubscriptionPlans } from "./services/subscription/planInitializer.js";
import { initializeChatbotTemplates } from "./services/ai/services/chatbot/utils/templateInitializer.js";

const PORT = process.env.PORT || 5000;

// Log AI Provider configuration
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || "openai";
const CHAT_PROVIDER =
  process.env.CHAT_PROVIDER || process.env.EMBEDDING_PROVIDER || "openai";

console.log("🤖 AI Provider Configuration:");
console.log(`   Embeddings: ${EMBEDDING_PROVIDER.toUpperCase()}`);
console.log(`   Chat: ${CHAT_PROVIDER.toUpperCase()}`);

if (EMBEDDING_PROVIDER === "ollama" || CHAT_PROVIDER === "ollama") {
  const OLLAMA_BASE_URL =
    process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  console.log(`   Ollama URL: ${OLLAMA_BASE_URL}`);
  console.log("   ⚠️  Make sure Ollama is running: ollama serve");
}

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const socketService = initializeSocketIO(server);

// Connect to database and initialize services
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize AI services
    await initializeAITextWriterService();
    await initializeAIImageGeneratorService();
    await initializeAIChatbotBuilderService();

    // Initialize subscription plans
    await initializeSubscriptionPlans();

    // Initialize chatbot templates
    await initializeChatbotTemplates();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(
        `📝 AI Text Writer: http://localhost:${PORT}/api/services/text/generate`
      );
      console.log(
        `🎨 AI Image Generator: http://localhost:${PORT}/api/services/image/generate`
      );
      console.log(
        `🤖 AI Chatbot Builder: http://localhost:${PORT}/api/chatbot`
      );
      console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
      console.log(
        `👥 Connected users: ${socketService.getConnectedUsersCount()}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
