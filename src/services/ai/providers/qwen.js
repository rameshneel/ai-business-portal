import axios from "axios";

// Lazy-loaded Qwen client config
let qwenConfig = null;

/**
 * Initialize Qwen (DashScope) client configuration
 * DashScope API Documentation: https://help.aliyun.com/zh/dashscope/
 */
export const getQwenConfig = () => {
  if (!qwenConfig) {
    const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "QWEN_API_KEY or DASHSCOPE_API_KEY environment variable is required"
      );
    }

    qwenConfig = {
      apiKey: apiKey,
      baseURL: "https://dashscope.aliyuncs.com/api/v1",
      timeout: 60000, // 60 seconds
    };
  }
  return qwenConfig;
};

/**
 * Generate image using Qwen Image Generation API
 * Model: wanx-v1 (Qwen Image Generation)
 * @param {string} prompt - Image generation prompt
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Image generation result
 */
export const generateQwenImage = async (prompt, options = {}) => {
  const {
    size = "1024*1024", // Qwen supports: 1024*1024, 1280*720, 720*1280
    style = "<auto>", // <auto>, <raw>, <cinematic-default>
    n = 1, // Number of images (1-4)
    seed = null,
  } = options;

  const config = getQwenConfig();

  try {
    console.log("🎨 Generating image with Qwen (DashScope)...");

    const requestBody = {
      model: "wanx-v1", // Qwen Image Generation model
      input: {
        prompt: prompt,
      },
      parameters: {
        size: size,
        style: style,
        n: Math.min(n, 4), // Max 4 images per request
      },
    };

    if (seed !== null) {
      requestBody.parameters.seed = seed;
    }

    // Try async first (better performance)
    let response = await axios.post(
      `${config.baseURL}/services/aigc/text2image/image-synthesis`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable", // Enable async
        },
        timeout: config.timeout,
      }
    );

    // Qwen returns task_id for async processing
    if (response.data.output && response.data.output.task_id) {
      // Poll for result
      return await pollQwenImageResult(response.data.output.task_id, config);
    }

    // If no task_id, try synchronous (remove async header)
    response = await axios.post(
      `${config.baseURL}/services/aigc/text2image/image-synthesis`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: config.timeout * 2, // Longer timeout for sync
      }
    );

    // Direct result (synchronous)
    if (response.data.output && response.data.output.results) {
      return {
        success: true,
        imageUrl: response.data.output.results[0].url,
        imageUrls: response.data.output.results.map((r) => r.url),
        taskId: response.data.output.task_id || null,
        model: "wanx-v1",
      };
    }

    throw new Error("No image URL in Qwen response");
  } catch (error) {
    console.error("❌ Qwen image generation error:", error.message);
    throw new Error(
      `Qwen image generation failed: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

/**
 * Poll for async image generation result
 * @param {string} taskId - Task ID from initial request
 * @param {Object} config - Qwen config
 * @returns {Promise<Object>} Image result
 */
const pollQwenImageResult = async (taskId, config, maxAttempts = 30) => {
  const pollInterval = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${config.baseURL}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: config.timeout,
      });

      const taskStatus = response.data.output?.task_status;

      if (taskStatus === "SUCCEEDED") {
        const results = response.data.output.results || [];
        if (results.length > 0) {
          return {
            success: true,
            imageUrl: results[0].url,
            imageUrls: results.map((r) => r.url),
            taskId: taskId,
            model: "wanx-v1",
          };
        }
      } else if (taskStatus === "FAILED") {
        throw new Error(
          response.data.output?.message || "Qwen image generation failed"
        );
      }

      // Still processing, wait and retry
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error("Qwen image generation timeout");
};

/**
 * Get supported sizes for Qwen
 */
export const getQwenSupportedSizes = () => {
  return ["1024*1024", "1280*720", "720*1280"];
};

/**
 * Get supported styles for Qwen
 */
export const getQwenSupportedStyles = () => {
  return ["<auto>", "<raw>", "<cinematic-default>"];
};
