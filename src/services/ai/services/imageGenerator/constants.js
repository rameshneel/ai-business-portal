// Image Generator Constants
export const IMAGE_GENERATION_CONSTANTS = {
  // Timeouts
  DEFAULT_TIMEOUT: 60000, // 60 seconds
  RETRY_DELAY: 2000, // 2 seconds
  MAX_RETRIES: 3,

  // Image Limits
  MIN_PROMPT_LENGTH: 3,
  MAX_PROMPT_LENGTH: 4000,

  // Default Values
  DEFAULT_SIZE: "1024x1024",
  DEFAULT_QUALITY: "standard",
  DEFAULT_STYLE: "vivid",

  // Retryable HTTP Status Codes
  RETRYABLE_STATUS_CODES: [429, 500, 502, 503],

  // Retryable Error Codes
  RETRYABLE_ERROR_CODES: ["ECONNRESET", "ETIMEDOUT"],
};

// Provider Model Mapping
export const PROVIDER_MODELS = {
  pollinations: "flux",
  qwen: "wanx-v1",
  stability: "stable-diffusion-xl-1024-v1-0",
  huggingface: "stabilityai/stable-diffusion-xl-base-1.0",
  hf: "stabilityai/stable-diffusion-xl-base-1.0",
  openai: "dall-e-3",
  dalle: "dall-e-3",
};

// Style Enhancement Mapping
export const STYLE_ENHANCEMENTS = {
  vivid: { prompt: "", dalleStyle: "vivid" },
  natural: { prompt: "", dalleStyle: "natural" },
  realistic: {
    prompt: "photorealistic, highly detailed, professional photography, ",
    dalleStyle: "vivid",
  },
  artistic: {
    prompt: "artistic style, creative composition, visually striking, ",
    dalleStyle: "vivid",
  },
  anime: {
    prompt:
      "anime style, manga illustration, Japanese animation style, vibrant colors, ",
    dalleStyle: "vivid",
  },
  "3d-render": {
    prompt: "3D render, computer graphics, digital art, CGI, ",
    dalleStyle: "vivid",
  },
  "oil-painting": {
    prompt:
      "oil painting style, classical art, brush strokes, canvas texture, ",
    dalleStyle: "natural",
  },
  watercolor: {
    prompt:
      "watercolor painting, soft brush strokes, translucent colors, artistic, ",
    dalleStyle: "natural",
  },
};

// Supported Styles
export const SUPPORTED_STYLES = [
  "vivid",
  "natural",
  "realistic",
  "artistic",
  "anime",
  "3d-render",
  "oil-painting",
  "watercolor",
];

// Supported Qualities
export const SUPPORTED_QUALITIES = ["standard", "hd"];

// Pollinations Model Mapping
export const POLLINATIONS_MODELS = {
  vivid: "flux",
  natural: "flux",
  realistic: "flux-dev",
  artistic: "flux",
  anime: "flux-schnell",
  "3d-render": "sdxl",
  "oil-painting": "flux",
  watercolor: "flux",
};

// Stability AI Style Mapping
export const STABILITY_STYLE_MAP = {
  vivid: "digital-art",
  natural: "photographic",
  realistic: "photographic",
  artistic: "digital-art",
  anime: "anime",
  "3d-render": "3d-model",
  "oil-painting": "enhance",
  watercolor: "digital-art",
};

// Qwen Size Mapping
export const QWEN_SIZE_MAP = {
  "1024x1024": "1024*1024",
  "1280x720": "1280*720",
  "720x1280": "720*1280",
};

// Qwen Style Mapping
export const QWEN_STYLE_MAP = {
  vivid: "<auto>",
  natural: "<raw>",
  realistic: "<auto>",
  artistic: "<cinematic-default>",
  anime: "<auto>",
  "3d-render": "<cinematic-default>",
  "oil-painting": "<raw>",
  watercolor: "<auto>",
};
