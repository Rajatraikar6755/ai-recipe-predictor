const express = require('express');
const router = express.Router();
const {
  generateRecipes,
  analyzeImage,
  saveRecipe,
  getSavedRecipes,
  getRecipeById,
  deleteRecipe,
  getSubstitutions,
} = require('../controllers/recipeController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validators');
const { aiLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// POST /api/recipes/generate
router.post('/generate', aiLimiter, validate(schemas.generateRecipesSchema), generateRecipes);

// POST /api/recipes/analyze-image
router.post('/analyze-image', aiLimiter, upload.single('image'), analyzeImage);

// GET /api/recipes/saved
router.get('/saved', getSavedRecipes);

// GET /api/recipes/substitutions?ingredient=...&context=...
router.get('/substitutions', aiLimiter, getSubstitutions);

// POST /api/recipes/save
router.post('/save', saveRecipe);

// GET /api/recipes/:id
router.get('/:id', getRecipeById);

// DELETE /api/recipes/:id
router.delete('/:id', deleteRecipe);

module.exports = router;
