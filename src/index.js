import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/database.js";
import { initializeSocketIO } from "./services/communication/socketIOService.js";
import { initializeAITextWriterService } from "./services/ai/serviceInitializer.js";
import { initializeSubscriptionPlans } from "./services/subscription/planInitializer.js";

const PORT = process.env.PORT || 5000;

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

    // Initialize subscription plans
    await initializeSubscriptionPlans();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(
        `📝 AI Text Writer: http://localhost:${PORT}/api/services/text/generate`
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
