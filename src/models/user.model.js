import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      index: true, // Explicit index for better performance
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [128, "Password cannot exceed 128 characters"],
      select: false,
      validate: {
        validator: function (v) {
          // At least one uppercase, one lowercase, one number, one special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            v
          );
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    },

    // Profile Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    // Role & Access
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false, // Don't include in queries by default
    },

    // Trial Information
    trialStart: {
      type: Date,
      default: null,
    },
    trialEnd: {
      type: Date,
      default: null,
    },
    trialUsed: {
      type: Boolean,
      default: false,
    },

    // Subscription Information
    subscription: {
      type: {
        type: String,
        enum: ["free", "premium", "enterprise"],
        default: "free",
      },
      startDate: Date,
      endDate: Date,
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },

    // Usage Tracking
    usageStats: {
      totalApiCalls: {
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
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isTrialActive = function () {
  if (!this.trialStart || !this.trialEnd) return false;
  return new Date() < this.trialEnd;
};

userSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

export default mongoose.model("User", userSchema);
