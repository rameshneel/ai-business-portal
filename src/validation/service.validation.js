import { body } from "express-validator";

// Service validation middleware
export const validateTextGeneration = [
  body("prompt")
    .trim()
    .notEmpty()
    .withMessage("Prompt is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Prompt must be between 10 and 1000 characters"),

  body("contentType")
    .isIn([
      "blog_post",
      "social_media",
      "email",
      "product_description",
      "ad_copy",
      "general",
    ])
    .withMessage(
      "Content type must be one of: blog_post, social_media, email, product_description, ad_copy, general"
    ),

  body("tone")
    .optional()
    .isIn([
      "professional",
      "casual",
      "creative",
      "persuasive",
      "friendly",
      "formal",
    ])
    .withMessage(
      "Tone must be one of: professional, casual, creative, persuasive, friendly, formal"
    ),

  body("length")
    .optional()
    .isIn(["short", "medium", "long"])
    .withMessage("Length must be one of: short, medium, long"),

  body("language")
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage("Language must be between 2 and 10 characters"),
];

// Future validation for other services can be added here:
// export const validateImageGeneration = [...];
// export const validateSearchQuery = [...];
// export const validateChatbotCreation = [...];
