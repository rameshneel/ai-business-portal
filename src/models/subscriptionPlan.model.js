import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    // Plan Details
    name: {
      type: String,
      required: [true, "Plan name is required"],
      unique: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Plan description is required"],
      trim: true,
    },

    // Pricing
    price: {
      monthly: {
        type: Number,
        required: true,
        min: [0, "Monthly price cannot be negative"],
      },
      yearly: {
        type: Number,
        required: true,
        min: [0, "Yearly price cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR"],
      },
    },

    // Plan Type
    type: {
      type: String,
      required: true,
      enum: ["free", "trial", "basic", "pro", "enterprise"],
      default: "basic",
    },

    // Features & Limits
    features: {
      aiTextWriter: {
        wordsPerDay: { type: Number, default: 0 },
        requestsPerDay: { type: Number, default: 0 },
        enabled: { type: Boolean, default: false },
      },
      aiImageGenerator: {
        imagesPerDay: { type: Number, default: 0 },
        requestsPerDay: { type: Number, default: 0 },
        enabled: { type: Boolean, default: false },
      },
      aiSearch: {
        searchesPerDay: { type: Number, default: 0 },
        requestsPerDay: { type: Number, default: 0 },
        enabled: { type: Boolean, default: false },
      },
      aiChatbot: {
        chatbotsPerAccount: { type: Number, default: 0 },
        messagesPerDay: { type: Number, default: 0 },
        enabled: { type: Boolean, default: false },
      },
      // General Features
      prioritySupport: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
    },

    // Trial Settings
    trial: {
      enabled: { type: Boolean, default: false },
      durationDays: { type: Number, default: 0 },
      features: {
        aiTextWriter: {
          wordsPerDay: { type: Number, default: 0 },
          requestsPerDay: { type: Number, default: 0 },
        },
        aiImageGenerator: {
          imagesPerDay: { type: Number, default: 0 },
          requestsPerDay: { type: Number, default: 0 },
        },
      },
    },

    // Stripe Integration
    stripe: {
      priceIdMonthly: { type: String, trim: true },
      priceIdYearly: { type: String, trim: true },
      productId: { type: String, trim: true },
    },

    // Plan Status
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },

    // Plan Order (for display)
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Plan Popularity
    isPopular: {
      type: Boolean,
      default: false,
    },

    // Metadata
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
subscriptionPlanSchema.index({ name: 1 });
subscriptionPlanSchema.index({ type: 1 });
subscriptionPlanSchema.index({ status: 1 });
subscriptionPlanSchema.index({ displayOrder: 1 });

// Instance methods
subscriptionPlanSchema.methods.isFree = function () {
  return this.type === "free" || this.price.monthly === 0;
};

subscriptionPlanSchema.methods.hasTrial = function () {
  return this.trial.enabled && this.trial.durationDays > 0;
};

subscriptionPlanSchema.methods.getFeatureLimit = function (service, limitType) {
  if (!this.features[service]) return 0;
  return this.features[service][limitType] || 0;
};

subscriptionPlanSchema.methods.isFeatureEnabled = function (service) {
  return this.features[service]?.enabled || false;
};

// Static methods
subscriptionPlanSchema.statics.getActivePlans = function () {
  return this.find({ status: "active" }).sort({ displayOrder: 1 });
};

subscriptionPlanSchema.statics.getFreePlan = function () {
  return this.findOne({ type: "free", status: "active" });
};

subscriptionPlanSchema.statics.getTrialPlan = function () {
  return this.findOne({ type: "trial", status: "active" });
};

// Pre-save middleware
subscriptionPlanSchema.pre("save", function (next) {
  this.metadata.updatedAt = new Date();
  next();
});

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
