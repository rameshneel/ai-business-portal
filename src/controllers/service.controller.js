import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ServiceUsage from "../models/serviceUsage.model.js";
import Service from "../models/service.model.js";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.model.js";
import { aiTextWriterService } from "../services/ai/services/textWriter/textWriterService.js";

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
    // Check if user has active subscription (Free or Paid)
    const subscription = await Subscription.findOne({ userId });

    const hasActiveSubscription = subscription && subscription.isActive();

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
          "response.success": true, // Only count successful requests
        },
      },
      {
        $group: {
          _id: null,
          totalWords: { $sum: "$response.data.wordsGenerated" },
        },
      },
    ]);

    const wordsUsedToday = todayUsage[0]?.totalWords || 0;
    console.log("🔍 Words used today:", wordsUsedToday);
    // Get limits based on subscription (Free or Paid)
    let maxWords = 500; // Default Free plan limit
    if (hasActiveSubscription && subscription.planId) {
      const plan = await SubscriptionPlan.findById(subscription.planId);
      if (plan && plan.features.aiTextWriter.enabled) {
        maxWords = plan.features.aiTextWriter.wordsPerDay;
      }
    }

    // For testing: Set default limit if 0
    if (maxWords === 0) {
      maxWords = 500; // Default limit for testing (500 words)
    }

    // CRITICAL: Enforce limit - prevent 100%+ usage (Non-streaming endpoint)
    if (wordsUsedToday >= maxWords) {
      const usagePercentage = Math.round((wordsUsedToday / maxWords) * 100);

      // Emit limit exceeded event via Socket.IO
      if (req.socketIO) {
        req.socketIO.emitToUser(userId, "usage_limit_exceeded", {
          service: "ai_text_writer",
          usage: {
            used: wordsUsedToday,
            limit: maxWords,
            percentage: usagePercentage,
            remaining: 0,
          },
          message: `🚫 Daily word limit reached (${maxWords} words). Please upgrade your plan or try again tomorrow.`,
          timestamp: new Date(),
        });
      }

      throw new ApiError(
        403,
        `Daily word limit reached (${maxWords} words used). Please upgrade your plan or try again tomorrow.`
      );
    }

    // Estimate words based on length option
    const estimateWordsByLength = (lengthOption) => {
      switch (lengthOption) {
        case "short":
          return 150; // Max estimate for short (50-150 words)
        case "long":
          return 500; // Estimate for long (400+ words)
        case "medium":
        default:
          return 400; // Estimate for medium (150-400 words)
      }
    };

    const estimatedWords = estimateWordsByLength(length || "medium");
    const totalWordsAfterGeneration = wordsUsedToday + estimatedWords;

    // Check if estimated generation will exceed limit
    if (totalWordsAfterGeneration > maxWords) {
      const remainingWords = maxWords - wordsUsedToday;
      const usagePercentage = Math.round((wordsUsedToday / maxWords) * 100);

      // Emit warning that this request might exceed limit
      if (req.socketIO) {
        req.socketIO.emitToUser(userId, "usage_limit_warning", {
          service: "ai_text_writer",
          usage: {
            used: wordsUsedToday,
            limit: maxWords,
            percentage: usagePercentage,
            remaining: remainingWords,
            estimated: estimatedWords,
          },
          message: `⚠️ Warning: This request may exceed your daily limit. Only ${remainingWords} words remaining.`,
          timestamp: new Date(),
        });
      }

      throw new ApiError(
        403,
        `Insufficient words remaining (${remainingWords} words left). Estimated request: ${estimatedWords} words. Please reduce content length or upgrade your plan.`
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
    "response.success": true,
  })
    .sort({ "request.timestamp": -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select("request response cost metadata createdAt");

  const total = await ServiceUsage.countDocuments({
    userId: userId,
    serviceId: service._id,
    "response.success": true,
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
        "response.success": true,
      },
    },
    {
      $group: {
        _id: null,
        totalWords: { $sum: "$response.data.wordsGenerated" },
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
        "response.success": true,
      },
    },
    {
      $group: {
        _id: null,
        totalWords: { $sum: "$response.data.wordsGenerated" },
        totalRequests: { $sum: 1 },
      },
    },
  ]);

  const user = await User.findById(userId);
  const subscription = await Subscription.findOne({ userId });

  const maxWords = subscription?.limits?.wordsPerDay || 500; // Default limit for testing
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
        accountType: "subscription",
      },
      "Usage statistics retrieved successfully"
    )
  );
});

export const generateTextStream = async (req, res) => {
  const { prompt, contentType, tone, length, language } = req.body;
  const userId = req.user?._id;

  // Input validation - use SSE format for errors
  if (!prompt?.trim() || !contentType) {
    res.status(400);
    res.write(
      `data: ${JSON.stringify({
        error: "Prompt and content type are required",
      })}\n\n`
    );
    res.end();
    return;
  }

  // Set headers for Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in Nginx

  // Flush headers immediately (best practice for SSE)
  res.flushHeaders();

  // Handle client disconnect gracefully
  req.on("close", () => {
    console.log("🔌 Client disconnected from stream");
    if (!res.writableEnded) {
      res.end();
    }
  });

  let fullText = "";

  try {
    // CRITICAL: Check usage limits BEFORE generation starts
    // This prevents 100%+ usage (must be checked before SSE headers are sent)
    const subscription = await Subscription.findOne({ userId }).populate(
      "planId"
    );
    const hasActiveSubscription = subscription && subscription.isActive();

    const service = await Service.findOne({
      type: "ai_text_writer",
      status: "active",
    });
    if (!service) {
      res.write(
        `data: ${JSON.stringify({
          error: "AI Text Writer service not available",
        })}\n\n`
      );
      res.end();
      return;
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
          "response.success": true,
        },
      },
      {
        $group: {
          _id: null,
          totalWords: { $sum: "$response.data.wordsGenerated" },
        },
      },
    ]);

    const wordsUsedToday = todayUsage[0]?.totalWords || 0;
    console.log("🔍 Words used today:", wordsUsedToday);
    // Get limits based on subscription
    let maxWords = 500; // Default Free plan limit
    if (hasActiveSubscription && subscription.planId) {
      const plan = subscription.planId;
      if (plan && plan.features?.aiTextWriter?.enabled) {
        maxWords = plan.features.aiTextWriter.wordsPerDay;
      }
    }

    // For testing: Set default limit if 0
    if (maxWords === 0) {
      maxWords = 500; // Default limit for testing (500 words)
    }

    // Estimate words based on length option
    const estimateWordsByLength = (lengthOption) => {
      switch (lengthOption) {
        case "short":
          return 150; // Max estimate for short (50-150 words)
        case "long":
          return 500; // Estimate for long (400+ words)
        case "medium":
        default:
          return 400; // Estimate for medium (150-400 words)
      }
    };

    const estimatedWords = estimateWordsByLength(length || "medium");
    const totalWordsAfterGeneration = wordsUsedToday + estimatedWords;

    // CRITICAL: Block if limit will be exceeded (prevent 100%+ usage)
    if (wordsUsedToday >= maxWords) {
      const usagePercentage = Math.round((wordsUsedToday / maxWords) * 100);

      // Emit limit exceeded event via Socket.IO
      if (req.socketIO) {
        req.socketIO.emitToUser(userId, "usage_limit_exceeded", {
          service: "ai_text_writer",
          usage: {
            used: wordsUsedToday,
            limit: maxWords,
            percentage: usagePercentage,
            remaining: 0,
          },
          message: `🚫 Daily word limit reached (${maxWords} words). Please upgrade your plan or try again tomorrow.`,
          timestamp: new Date(),
        });
      }

      res.write(
        `data: ${JSON.stringify({
          error: `Daily word limit reached (${maxWords} words used). Please upgrade your plan or try again tomorrow.`,
          limitExceeded: true,
          usage: {
            used: wordsUsedToday,
            limit: maxWords,
            percentage: usagePercentage,
          },
        })}\n\n`
      );
      res.end();
      return;
    }

    // Check if estimated generation will exceed limit
    if (totalWordsAfterGeneration > maxWords) {
      const remainingWords = maxWords - wordsUsedToday;
      const usagePercentage = Math.round((wordsUsedToday / maxWords) * 100);

      // Emit warning that this request might exceed limit
      if (req.socketIO) {
        req.socketIO.emitToUser(userId, "usage_limit_warning", {
          service: "ai_text_writer",
          usage: {
            used: wordsUsedToday,
            limit: maxWords,
            percentage: usagePercentage,
            remaining: remainingWords,
            estimated: estimatedWords,
          },
          message: `⚠️ Warning: This request may exceed your daily limit. Only ${remainingWords} words remaining.`,
          timestamp: new Date(),
        });
      }

      res.write(
        `data: ${JSON.stringify({
          error: `Insufficient words remaining (${remainingWords} words left). Estimated request: ${estimatedWords} words. Please reduce content length or upgrade your plan.`,
          limitWarning: true,
          usage: {
            used: wordsUsedToday,
            limit: maxWords,
            remaining: remainingWords,
            estimated: estimatedWords,
          },
        })}\n\n`
      );
      res.end();
      return;
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
      res.write(
        `data: ${JSON.stringify({
          error: validation.errors.join(", "),
        })}\n\n`
      );
      res.end();
      return;
    }

    // Emit AI service start event (optional - for Socket.IO notifications)
    if (req.socketIO && userId) {
      req.socketIO.emitToUser(userId, "ai_text_generation_start", {
        contentType: contentType,
        prompt: prompt,
        mode: "streaming",
        timestamp: new Date(),
      });
    }

    // Start streaming generator
    const stream = aiTextWriterService.generateTextStream(prompt, contentType, {
      tone,
      length,
      language,
    });

    // Process generator: only strings are yielded, final object is returned
    for await (const chunk of stream) {
      // Generator yields only strings - no object checks needed
      if (typeof chunk === "string") {
        fullText += chunk;
        // Send chunk to client immediately
        res.write(`data: ${JSON.stringify({ chunk, partial: fullText })}\n\n`);
      }
      // Note: Final result object comes as return value, not yield
    }

    // Get final result from generator return value
    // In async generators, the return value is accessed after loop completes
    // But we can't directly access it, so we calculate from fullText
    const trimmedText = fullText.trim();
    const wordsGenerated = trimmedText
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    // Save usage record only if user is authenticated and text was generated
    if (!userId) {
      console.warn("⚠️ Stream: No userId found, skipping usage save");
    } else if (trimmedText.length > 0 && wordsGenerated > 0) {
      try {
        const service = await Service.findOne({ type: "ai_text_writer" });

        if (!service) {
          console.error("❌ Stream: AI Text Writer service not found");
        } else {
          const usageRecord = new ServiceUsage({
            userId: userId,
            serviceId: service._id,
            request: {
              type: contentType || "ai_text_writer",
              prompt: prompt,
              parameters: {
                contentType,
                tone,
                length,
                language,
                mode: "streaming",
              },
              timestamp: new Date(),
            },
            response: {
              success: true,
              data: {
                content: trimmedText,
                wordsGenerated: wordsGenerated,
              },
              timestamp: new Date(),
            },
          });
          await usageRecord.save();
          console.log("✅ Stream ServiceUsage saved successfully:", {
            wordsGenerated,
            userId: userId.toString(),
            serviceId: service._id.toString(),
          });

          // Emit completion event with updated usage
          const finalWordsUsed = wordsUsedToday + wordsGenerated;
          const finalUsagePercentage = Math.round(
            (finalWordsUsed / maxWords) * 100
          );

          if (req.socketIO) {
            req.socketIO.emitToUser(userId, "ai_service_complete", {
              service: "ai_text_writer",
              contentType: contentType,
              wordsGenerated: wordsGenerated,
              mode: "streaming",
              timestamp: new Date(),
            });

            // Emit updated usage after generation
            req.socketIO.emitToUser(userId, "usage_updated", {
              service: "ai_text_writer",
              usage: {
                used: finalWordsUsed,
                limit: maxWords,
                percentage: finalUsagePercentage,
                remaining: Math.max(0, maxWords - finalWordsUsed),
              },
              message:
                finalUsagePercentage >= 100
                  ? `🚫 You've reached your daily limit (${maxWords} words)`
                  : finalUsagePercentage >= 95
                  ? `⚠️ You've used ${finalUsagePercentage}% of your daily limit!`
                  : `📊 You've used ${finalUsagePercentage}% of your daily limit.`,
              timestamp: new Date(),
            });

            // Emit warning if now at 80%+ threshold
            if (finalUsagePercentage >= 80) {
              req.socketIO.emitToUser(userId, "usage_warning", {
                service: "ai_text_writer",
                usage: {
                  used: finalWordsUsed,
                  limit: maxWords,
                  percentage: finalUsagePercentage,
                  remaining: Math.max(0, maxWords - finalWordsUsed),
                },
                message:
                  finalUsagePercentage >= 100
                    ? `🚫 You've reached your daily limit!`
                    : finalUsagePercentage >= 95
                    ? `⚠️ You've used ${finalUsagePercentage}% of your daily limit!`
                    : `📊 You've used ${finalUsagePercentage}% of your daily limit.`,
                timestamp: new Date(),
              });
            }
          }
        }
      } catch (saveError) {
        console.error("❌ Streaming ServiceUsage save error:", saveError);
        // Don't fail the stream if saving fails
      }
    } else {
      console.warn("⚠️ Stream: No text generated, skipping usage save", {
        fullTextLength: fullText?.length || 0,
        wordsGenerated,
      });
    }

    // Send completion signal with final data
    res.write(
      `data: ${JSON.stringify({
        done: true,
        fullText: trimmedText,
        wordsGenerated,
        contentType,
        success: true,
      })}\n\n`
    );
  } catch (error) {
    console.error("❌ Streaming error:", error);
    // Send error via SSE format
    res.write(
      `data: ${JSON.stringify({
        error: error.message || "An error occurred during text generation",
      })}\n\n`
    );
  } finally {
    // Always end the stream
    if (!res.writableEnded) {
      res.end();
    }
  }
};

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
