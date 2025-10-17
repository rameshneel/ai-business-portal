import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ServiceUsage from "../models/serviceUsage.model.js";
import Service from "../models/service.model.js";
import Trial from "../models/trial.model.js";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import { aiTextWriterService } from "../services/ai/textWriterService.js";

// AI Text Writer Service
export const generateText = asyncHandler(async (req, res) => {
  const { prompt, contentType, tone, length, language } = req.body;
  const userId = req.user._id;
  let service = null; // Declare service variable at function scope

  // Validation
  if (!prompt || !contentType) {
    throw new ApiError(400, "Prompt and content type are required");
  }

  try {
    // Check if user has active trial or subscription
    const subscription = await Subscription.findOne({ userId });
    const trial = await Trial.findOne({ userId, status: "active" });

    const hasActiveSubscription = subscription && subscription.isActive();
    const hasActiveTrial = trial && trial.isActive();

    if (!hasActiveSubscription && !hasActiveTrial) {
      throw new ApiError(
        403,
        "No active trial or subscription. Please start a trial or subscribe to a plan."
      );
    }

    // Get AI Text Writer service
    service = await Service.findOne({
      type: "ai_text_writer",
      status: "active",
    });
    if (!service) {
      throw new ApiError(404, "AI Text Writer service not available");
    }

    // Check usage limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await ServiceUsage.aggregate([
      {
        $match: {
          userId: userId,
          serviceId: service._id,
          "request.timestamp": { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          totalWords: { $sum: "$usage.wordsGenerated" },
        },
      },
    ]);

    const wordsUsedToday = todayUsage[0]?.totalWords || 0;

    // Get limits based on subscription or trial
    let maxWords = 0;
    if (hasActiveSubscription) {
      maxWords = subscription.limits?.aiTextWriter?.wordsPerDay || 0;
    } else if (hasActiveTrial) {
      maxWords = trial.limits?.wordsPerDay || 1000;
    }

    if (maxWords === 0) {
      throw new ApiError(
        403,
        "AI Text Writer service is not available in your current plan"
      );
    }

    if (wordsUsedToday >= maxWords) {
      throw new ApiError(
        403,
        `Daily word limit reached (${maxWords} words). Upgrade your plan for more words.`
      );
    }

    // Emit usage warning if approaching limit (80% threshold)
    const usagePercentage = (wordsUsedToday / maxWords) * 100;
    if (req.socketIO && usagePercentage >= 80) {
      req.socketIO.emitToUser(userId, "usage_warning", {
        service: "ai_text_writer",
        usage: {
          used: wordsUsedToday,
          limit: maxWords,
          percentage: Math.round(usagePercentage),
          remaining: maxWords - wordsUsedToday,
        },
        message:
          usagePercentage >= 95
            ? `⚠️ You've used ${Math.round(
                usagePercentage
              )}% of your daily limit!`
            : `📊 You've used ${Math.round(
                usagePercentage
              )}% of your daily limit.`,
        timestamp: new Date(),
      });
    }

    // Validate input using service
    const validation = aiTextWriterService.validateInput(prompt, contentType);
    if (!validation.isValid) {
      throw new ApiError(400, validation.errors.join(", "));
    }

    // Emit AI service start event
    if (req.socketIO) {
      req.socketIO.emitToUser(userId, "ai_text_generation_start", {
        contentType: contentType,
        prompt: prompt,
        timestamp: new Date(),
      });
    }

    // Generate text using service
    const result = await aiTextWriterService.generateText(prompt, contentType, {
      tone,
      length,
      language,
    });

    console.log("AI Text Generation Result:", {
      success: result.success,
      hasContent: !!result.content,
      wordsGenerated: result.wordsGenerated,
      model: result.model,
    });

    if (!result.success) {
      throw new ApiError(500, `Text generation failed: ${result.error}`);
    }

    const generatedText = result.content;
    const wordsGenerated = result.wordsGenerated;

    // Save usage record
    const usageRecord = new ServiceUsage({
      userId: userId,
      serviceId: service._id,
      request: {
        type: contentType || "ai_text_writer",
        prompt: prompt,
        parameters: {
          contentType: contentType,
          tone: tone,
          length: length,
          language: language,
        },
        timestamp: new Date(),
      },
      response: {
        success: true,
        data: {
          content: generatedText,
          wordsGenerated: wordsGenerated,
        },
        timestamp: new Date(),
      },
    });

    try {
      await usageRecord.save();
      console.log("✅ ServiceUsage saved successfully");
    } catch (saveError) {
      console.error("❌ ServiceUsage save error:", saveError);
      throw saveError;
    }

    // Update service statistics with performance data
    await Service.findByIdAndUpdate(service._id, {
      $inc: {
        "statistics.totalRequests": 1,
        "statistics.successfulRequests": 1,
        "statistics.totalUsage": wordsGenerated,
      },
      $set: {
        "statistics.averageResponseTime": result.duration,
      },
    });

    // Emit AI service completion event
    if (req.socketIO) {
      req.socketIO.emitToUser(userId, "ai_service_complete", {
        service: "ai_text_writer",
        result: {
          contentType: contentType,
          wordsGenerated: wordsGenerated,
          duration: result.duration,
        },
        timestamp: new Date(),
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          generatedText: generatedText,
          wordsGenerated: wordsGenerated,
          contentType: contentType,
          duration: result.duration,
          usage: {
            wordsUsedToday: wordsUsedToday + wordsGenerated,
            maxWords: maxWords,
            remainingWords: maxWords - (wordsUsedToday + wordsGenerated),
          },
        },
        "Text generated successfully"
      )
    );
  } catch (error) {
    console.error("AI Text Generation Error:", error);
    if (userId && service) {
      try {
        const failedUsage = new ServiceUsage({
          userId: userId,
          serviceId: service._id,
          request: {
            type: contentType || "ai_text_writer",
            prompt: prompt,
            parameters: {
              contentType: contentType,
              tone: tone,
              length: length,
              language: language,
            },
            timestamp: new Date(),
          },
          response: {
            success: false,
            error: {
              code: error.code || "GENERATION_ERROR",
              message: error.message,
            },
            timestamp: new Date(),
          },
        });
        await failedUsage.save();
        console.log("✅ Failed ServiceUsage saved successfully");
      } catch (saveError) {
        console.error("❌ Failed ServiceUsage save error:", saveError);
        // Don't throw here, just log the error
      }
    }

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Text generation failed: ${error.message}`);
  }
});

// Get user's text generation history
export const getTextHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const service = await Service.findOne({ type: "ai_text_writer" });
  if (!service) {
    throw new ApiError(404, "AI Text Writer service not found");
  }

  const skip = (page - 1) * limit;

  const history = await ServiceUsage.find({
    userId: userId,
    serviceId: service._id,
    status: "success",
  })
    .sort({ "request.timestamp": -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select("request response usage createdAt");

  const total = await ServiceUsage.countDocuments({
    userId: userId,
    serviceId: service._id,
    status: "success",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        history: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
      },
      "Text history retrieved successfully"
    )
  );
});

// Get usage statistics
export const getUsageStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const service = await Service.findOne({ type: "ai_text_writer" });
  if (!service) {
    throw new ApiError(404, "AI Text Writer service not found");
  }

  // Get today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayUsage = await ServiceUsage.aggregate([
    {
      $match: {
        userId: userId,
        serviceId: service._id,
        "request.timestamp": { $gte: today },
        status: "success",
      },
    },
    {
      $group: {
        _id: null,
        totalWords: { $sum: "$usage.wordsGenerated" },
        totalRequests: { $sum: 1 },
      },
    },
  ]);

  // Get this month's usage
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthUsage = await ServiceUsage.aggregate([
    {
      $match: {
        userId: userId,
        serviceId: service._id,
        "request.timestamp": { $gte: monthStart },
        status: "success",
      },
    },
    {
      $group: {
        _id: null,
        totalWords: { $sum: "$usage.wordsGenerated" },
        totalRequests: { $sum: 1 },
      },
    },
  ]);

  const user = await User.findById(userId);
  const trial = await Trial.findOne({ userId, status: "active" });

  const maxWords = trial
    ? trial.limits.wordsPerDay
    : user.subscription?.limits?.wordsPerDay || 1000;
  const todayStats = todayUsage[0] || { totalWords: 0, totalRequests: 0 };
  const monthStats = monthUsage[0] || { totalWords: 0, totalRequests: 0 };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        today: {
          wordsUsed: todayStats.totalWords,
          requests: todayStats.totalRequests,
          maxWords: maxWords,
          remainingWords: maxWords - todayStats.totalWords,
        },
        thisMonth: {
          wordsUsed: monthStats.totalWords,
          requests: monthStats.totalRequests,
        },
        accountType: trial ? "trial" : "subscription",
      },
      "Usage statistics retrieved successfully"
    )
  );
});

// Get AI Text Writer service options
export const getTextWriterOptions = asyncHandler(async (req, res) => {
  const contentTypes = aiTextWriterService.getContentTypes();
  const tones = aiTextWriterService.getTones();
  const lengths = aiTextWriterService.getLengths();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        contentTypes: contentTypes,
        tones: tones,
        lengths: lengths,
      },
      "Service options retrieved successfully"
    )
  );
});
