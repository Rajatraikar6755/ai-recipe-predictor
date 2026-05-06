const Recipe = require('../models/Recipe');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const path = require('path');
const fs = require('fs');

// ─── POST /api/recipes/generate ───────────────────────────────────────────────
const generateRecipes = async (req, res, next) => {
  try {
    const { ingredients, filters, count } = req.body;

    // Call AI service
    const result = await aiService.generateRecipes(ingredients, filters, count);

    // Increment user's generated count
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.recipesGenerated': 1 } });

    return sendSuccess(res, 200, result.isFallback ? 'Showing sample recipes (AI unavailable)' : 'Recipes generated successfully!', {
      recipes: result.recipes,
      generatedFrom: ingredients,
      model: result.model,
      tokensUsed: result.tokensUsed,
      isFallback: result.isFallback || false,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/recipes/analyze-image ─────────────────────────────────────────
const analyzeImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image file uploaded.');
    }

    const result = await aiService.analyzeImage(req.file.path);

    // Clean up uploaded file after analysis
    fs.unlink(req.file.path, (err) => {
      if (err) console.warn('Could not delete temp file:', err.message);
    });

    return sendSuccess(res, 200, 'Image analyzed successfully', result);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/recipes/save ───────────────────────────────────────────────────
const saveRecipe = async (req, res, next) => {
  try {
    const recipeData = req.body;

    // Check if user hasn't already saved this exact recipe
    const existingRecipe = await Recipe.findOne({
      createdBy: req.user._id,
      title: recipeData.title,
    });

    if (existingRecipe) {
      return sendError(res, 409, 'You have already saved a recipe with this name.');
    }

    // Create recipe
    const recipe = await Recipe.create({
      ...recipeData,
      createdBy: req.user._id,
      isAiGenerated: true,
    });

    // Add to user's saved recipes and update stats
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { savedRecipes: recipe._id },
      $inc: { 'stats.recipesSaved': 1 },
    });

    return sendSuccess(res, 201, 'Recipe saved successfully!', { recipe });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/recipes/saved ───────────────────────────────────────────────────
const getSavedRecipes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      dietary,
      maxCookingTime,
      minCalories,
      maxCalories,
      difficulty,
      sort = 'newest',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter query
    const query = { createdBy: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (dietary) {
      const dietaryArr = Array.isArray(dietary) ? dietary : dietary.split(',');
      query.tags = { $in: dietaryArr };
    }

    if (maxCookingTime) {
      query['cookingTime.total'] = { $lte: parseInt(maxCookingTime) };
    }

    if (minCalories || maxCalories) {
      query['nutrition.calories'] = {};
      if (minCalories) query['nutrition.calories'].$gte = parseInt(minCalories);
      if (maxCalories) query['nutrition.calories'].$lte = parseInt(maxCalories);
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Sort options
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'calories-asc': { 'nutrition.calories': 1 },
      'calories-desc': { 'nutrition.calories': -1 },
      'time-asc': { 'cookingTime.total': 1 },
      'time-desc': { 'cookingTime.total': -1 },
    };

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Recipe.countDocuments(query),
    ]);

    return sendPaginated(res, recipes, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/recipes/:id ─────────────────────────────────────────────────────
const getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!recipe) {
      return sendError(res, 404, 'Recipe not found.');
    }

    return sendSuccess(res, 200, 'Recipe fetched', { recipe });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/recipes/:id ──────────────────────────────────────────────────
const deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!recipe) {
      return sendError(res, 404, 'Recipe not found or you do not have permission to delete it.');
    }

    // Remove from user's saved list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedRecipes: recipe._id },
      $inc: { 'stats.recipesSaved': -1 },
    });

    return sendSuccess(res, 200, 'Recipe deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/recipes/substitutions ──────────────────────────────────────────
const getSubstitutions = async (req, res, next) => {
  try {
    const { ingredient, context } = req.query;

    if (!ingredient) {
      return sendError(res, 400, 'Ingredient parameter is required.');
    }

    const result = await aiService.getSubstitutions(ingredient, context);

    return sendSuccess(res, 200, 'Substitutions fetched', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRecipes,
  analyzeImage,
  saveRecipe,
  getSavedRecipes,
  getRecipeById,
  deleteRecipe,
  getSubstitutions,
};
