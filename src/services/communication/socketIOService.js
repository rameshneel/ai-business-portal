import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";

// Socket.IO Service Class
export class SocketIOService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> userInfo mapping

    this.initializeMiddleware();
    this.initializeEventHandlers();
  }

  // Initialize Socket.IO middleware for authentication
  initializeMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "") ||
          socket.handshake.headers.token;

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id).select(
          "-password -refreshToken"
        );

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = user._id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Invalid authentication token"));
      }
    });
  }

  // Initialize event handlers
  initializeEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔌 User connected: ${socket.user.email} (${socket.id})`);

      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, {
        userId: socket.userId,
        user: socket.user,
        connectedAt: new Date(),
      });

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Join user to role-based rooms
      socket.join(`role:${socket.user.role}`);

      // Emit connection success
      socket.emit("connected", {
        message: "Successfully connected to server",
        userId: socket.userId,
        user: socket.user,
        timestamp: new Date(),
      });

      // Notify other users about new connection (if needed)
      socket.broadcast.emit("user_online", {
        userId: socket.userId,
        user: {
          _id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          email: socket.user.email,
          role: socket.user.role,
        },
        timestamp: new Date(),
      });

      // Handle AI service events
      this.handleAIServiceEvents(socket);

      // Handle chat events
      this.handleChatEvents(socket);

      // Handle notification events
      this.handleNotificationEvents(socket);

      // Handle subscription events
      this.handleSubscriptionEvents(socket);

      // Handle admin events
      this.handleAdminEvents(socket);

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(
          `🔌 User disconnected: ${socket.user.email} (${socket.id}) - ${reason}`
        );

        // Remove user from connected users
        this.connectedUsers.delete(socket.userId);
        this.userSockets.delete(socket.id);

        // Notify other users about disconnection
        socket.broadcast.emit("user_offline", {
          userId: socket.userId,
          timestamp: new Date(),
        });
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
        socket.emit("error", {
          message: "An error occurred",
          error: error.message,
        });
      });
    });
  }

  // Handle AI service events
  handleAIServiceEvents(socket) {
    // AI Text Generation Progress
    socket.on("ai_text_generation_start", (data) => {
      console.log(`📝 AI Text generation started for user ${socket.userId}`);
      socket.emit("ai_text_generation_progress", {
        status: "started",
        contentType: data.contentType,
        timestamp: new Date(),
      });
    });

    // AI Image Generation Progress
    socket.on("ai_image_generation_start", (data) => {
      console.log(`🎨 AI Image generation started for user ${socket.userId}`);
      socket.emit("ai_image_generation_progress", {
        status: "started",
        prompt: data.prompt,
        timestamp: new Date(),
      });
    });

    // AI Service Completion
    socket.on("ai_service_complete", (data) => {
      console.log(`✅ AI Service completed for user ${socket.userId}`);
      socket.emit("ai_service_result", {
        service: data.service,
        result: data.result,
        timestamp: new Date(),
      });
    });
  }

  // Handle subscription events
  handleSubscriptionEvents(socket) {
    // Subscription status request
    socket.on("subscription_status_request", () => {
      console.log(`💳 Subscription status requested by ${socket.userId}`);
      socket.emit("subscription_status_requested", {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Trial expiration check
    socket.on("trial_expiration_check", () => {
      console.log(`⏰ Trial expiration check requested by ${socket.userId}`);
      socket.emit("trial_expiration_check_requested", {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Usage limit check
    socket.on("usage_limit_check", (data) => {
      console.log(`📊 Usage limit check requested by ${socket.userId}:`, data);
      socket.emit("usage_limit_check_requested", {
        service: data.service,
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Upgrade prompt acknowledgment
    socket.on("upgrade_prompt_acknowledged", (data) => {
      console.log(`✅ Upgrade prompt acknowledged by ${socket.userId}:`, data);
      socket.emit("upgrade_prompt_acknowledged", {
        promptId: data.promptId,
        action: data.action, // 'upgrade', 'dismiss', 'remind_later'
        userId: socket.userId,
        timestamp: new Date(),
      });
    });
  }

  // Handle chat events
  handleChatEvents(socket) {
    // Join chat room
    socket.on("join_chat", (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`💬 User ${socket.userId} joined chat ${chatId}`);

      socket.emit("chat_joined", {
        chatId: chatId,
        message: "Successfully joined chat",
        timestamp: new Date(),
      });
    });

    // Leave chat room
    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`💬 User ${socket.userId} left chat ${chatId}`);
    });

    // Send message
    socket.on("send_message", (data) => {
      const { chatId, message, type = "text" } = data;

      console.log(`💬 Message from user ${socket.userId} in chat ${chatId}`);

      // Broadcast message to all users in the chat
      socket.to(`chat:${chatId}`).emit("new_message", {
        chatId: chatId,
        message: {
          id: Date.now().toString(),
          senderId: socket.userId,
          sender: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            email: socket.user.email,
          },
          content: message,
          type: type,
          timestamp: new Date(),
        },
      });
    });
  }

  // Handle notification events
  handleNotificationEvents(socket) {
    // Send notification to specific user
    socket.on("send_notification", (data) => {
      const { userId, notification } = data;

      if (this.connectedUsers.has(userId)) {
        const targetSocketId = this.connectedUsers.get(userId);
        this.io.to(targetSocketId).emit("notification", {
          ...notification,
          timestamp: new Date(),
        });
      }
    });

    // Mark notification as read
    socket.on("mark_notification_read", (notificationId) => {
      console.log(
        `🔔 Notification ${notificationId} marked as read by user ${socket.userId}`
      );
      socket.emit("notification_read", {
        notificationId: notificationId,
        timestamp: new Date(),
      });
    });
  }

  // Handle admin events
  handleAdminEvents(socket) {
    // Admin broadcast to all users
    socket.on("admin_broadcast", (data) => {
      if (socket.user.role === "admin") {
        console.log(`📢 Admin broadcast from ${socket.user.email}`);
        this.io.emit("admin_message", {
          message: data.message,
          type: data.type || "info",
          admin: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
          },
          timestamp: new Date(),
        });
      }
    });

    // Admin send to specific role
    socket.on("admin_role_message", (data) => {
      if (socket.user.role === "admin") {
        const { role, message, type = "info" } = data;
        console.log(
          `📢 Admin message to role ${role} from ${socket.user.email}`
        );

        this.io.to(`role:${role}`).emit("admin_message", {
          message: message,
          type: type,
          targetRole: role,
          admin: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
          },
          timestamp: new Date(),
        });
      }
    });
  }

  // Public methods for external use
  emitToUser(userId, event, data) {
    if (this.connectedUsers.has(userId)) {
      const socketId = this.connectedUsers.get(userId);
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  emitToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  emitToAll(event, data) {
    this.io.emit(event, data);
  }

  getConnectedUsers() {
    return Array.from(this.userSockets.values());
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Export singleton instance
let socketIOService = null;

export const initializeSocketIO = (server) => {
  if (!socketIOService) {
    socketIOService = new SocketIOService(server);
  }
  return socketIOService;
};

export const getSocketIOService = () => {
  return socketIOService;
};
