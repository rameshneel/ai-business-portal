import mongoose from "mongoose";

const trialSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Trial Period
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: true,
    },

    // Trial Status
    status: {
      type: String,
      enum: ["active", "expired", "converted", "cancelled"],
      default: "active",
    },

    // Usage Tracking
    usage: {
      totalCalls: {
        type: Number,
        default: 0,
      },
      textGenerationCalls: {
        type: Number,
        default: 0,
      },
      imageGenerationCalls: {
        type: Number,
        default: 0,
      },
      chatbotCalls: {
        type: Number,
        default: 0,
      },
      searchCalls: {
        type: Number,
        default: 0,
      },
      lastUsed: Date,
    },

    // Trial Plan Reference
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    },

    // Enhanced Limits (based on trial plan)
    limits: {
      // AI Text Writer
      wordsPerDay: { type: Number, default: 1000 },
      requestsPerDay: { type: Number, default: 10 },

      // AI Image Generator
      imagesPerDay: { type: Number, default: 5 },
      imageRequestsPerDay: { type: Number, default: 5 },

      // AI Search
      searchesPerDay: { type: Number, default: 20 },
      searchRequestsPerDay: { type: Number, default: 20 },

      // AI Chatbot
      chatbotsPerAccount: { type: Number, default: 1 },
      messagesPerDay: { type: Number, default: 50 },

      // General
      maxCalls: { type: Number, default: 50 },
      maxDuration: { type: Number, default: 7 }, // days
    },

    // Conversion Tracking
    conversion: {
      converted: {
        type: Boolean,
        default: false,
      },
      convertedAt: Date,
      convertedTo: {
        type: String,
        enum: ["premium", "enterprise"],
      },
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    },

    // Notifications
    notifications: {
      reminderSent: {
        type: Boolean,
        default: false,
      },
      reminderSentAt: Date,
      expirySent: {
        type: Boolean,
        default: false,
      },
      expirySentAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
trialSchema.index({ userId: 1 });
trialSchema.index({ status: 1 });
trialSchema.index({ endTime: 1 });
trialSchema.index({ createdAt: -1 });

// Pre-save middleware
trialSchema.pre("save", function (next) {
  if (this.isNew) {
    // Set end time to 7 days from start (trial duration)
    this.endTime = new Date(
      this.startTime.getTime() + this.limits.maxDuration * 24 * 60 * 60 * 1000
    );
  }
  next();
});

// Instance methods
trialSchema.methods.isActive = function () {
  return this.status === "active" && new Date() < this.endTime;
};

trialSchema.methods.isExpired = function () {
  return new Date() >= this.endTime;
};

trialSchema.methods.getRemainingTime = function () {
  const now = new Date();
  const remaining = this.endTime.getTime() - now.getTime();
  return Math.max(0, remaining);
};

trialSchema.methods.getRemainingCalls = function () {
  return Math.max(0, this.limits.maxCalls - this.usage.totalCalls);
};

trialSchema.methods.canMakeCall = function () {
  return this.isActive() && this.getRemainingCalls() > 0;
};

export default mongoose.model("Trial", trialSchema);
