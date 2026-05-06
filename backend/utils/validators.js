const Joi = require('joi');

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  dietaryPreferences: Joi.array().items(
    Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'halal', 'kosher')
  ),
  allergies: Joi.array().items(Joi.string().trim()),
  cookingSkillLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  avatar: Joi.string().uri().allow(''),
});

// ─── Recipe Validators ────────────────────────────────────────────────────────
const generateRecipesSchema = Joi.object({
  ingredients: Joi.array().items(Joi.string().trim()).min(1).max(20).required().messages({
    'array.min': 'Please provide at least 1 ingredient',
    'array.max': 'Maximum 20 ingredients allowed',
    'any.required': 'Ingredients are required',
  }),
  filters: Joi.object({
    dietary: Joi.array().items(
      Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo')
    ).default([]),
    maxCookingTime: Joi.number().integer().min(5).max(480).default(60),
    maxCalories: Joi.number().integer().min(100).max(5000).allow(null).default(null),
    difficulty: Joi.string().valid('easy', 'medium', 'hard', 'any').default('any'),
    servings: Joi.number().integer().min(1).max(12).default(2),
    cuisine: Joi.string().trim().allow('').default(''),
  }).default({}),
  count: Joi.number().integer().min(1).max(5).default(3),
});

const filterRecipesSchema = Joi.object({
  dietary: Joi.array().items(Joi.string()),
  maxCookingTime: Joi.number().integer().positive(),
  minCalories: Joi.number().integer().positive(),
  maxCalories: Joi.number().integer().positive(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard'),
  search: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
  sort: Joi.string().valid('newest', 'oldest', 'calories-asc', 'calories-desc', 'time-asc', 'time-desc').default('newest'),
});

// ─── Chat Validators ──────────────────────────────────────────────────────────
const chatMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 2000 characters',
    'any.required': 'Message is required',
  }),
  sessionId: Joi.string().trim().max(100).default('default'),
});

// ─── Meal Plan Validators ─────────────────────────────────────────────────────
const mealPlanUpdateSchema = Joi.object({
  weekStart: Joi.date().required(),
  days: Joi.array().items(
    Joi.object({
      day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
      breakfast: Joi.object({
        recipeId: Joi.string().allow(null, ''),
        customMeal: Joi.string().allow(''),
        notes: Joi.string().allow(''),
      }),
      lunch: Joi.object({
        recipeId: Joi.string().allow(null, ''),
        customMeal: Joi.string().allow(''),
        notes: Joi.string().allow(''),
      }),
      dinner: Joi.object({
        recipeId: Joi.string().allow(null, ''),
        customMeal: Joi.string().allow(''),
        notes: Joi.string().allow(''),
      }),
      snacks: Joi.array().items(Joi.object({
        recipeId: Joi.string().allow(null, ''),
        customMeal: Joi.string().allow(''),
        notes: Joi.string().allow(''),
      })),
    })
  ),
  totalCaloriesTarget: Joi.number().integer().min(500).max(10000),
});

// ─── Validation Middleware Factory ────────────────────────────────────────────
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    req[source] = value; // Replace with sanitized value
    next();
  };
};

module.exports = {
  validate,
  schemas: {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    generateRecipesSchema,
    filterRecipesSchema,
    chatMessageSchema,
    mealPlanUpdateSchema,
  },
};
