const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  amount: { type: String, default: '' },
  unit: { type: String, default: '' },
  _id: false,
});

const instructionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  description: { type: String, required: true },
  duration: { type: String, default: '' }, // e.g., "5 minutes"
  tip: { type: String, default: '' },
  _id: false,
});

const nutritionSchema = new mongoose.Schema({
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },   // grams
  carbohydrates: { type: Number, default: 0 }, // grams
  fat: { type: Number, default: 0 },       // grams
  fiber: { type: Number, default: 0 },     // grams
  sugar: { type: Number, default: 0 },     // grams
  sodium: { type: Number, default: 0 },    // mg
  _id: false,
});

const substitutionSchema = new mongoose.Schema({
  original: { type: String, required: true },
  alternatives: [{ type: String }],
  note: { type: String, default: '' },
  _id: false,
});

const cookingTimeSchema = new mongoose.Schema({
  prep: { type: Number, default: 0 },  // minutes
  cook: { type: Number, default: 0 },  // minutes
  total: { type: Number, default: 0 }, // minutes
  _id: false,
});

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Recipe title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    ingredients: [ingredientSchema],
    instructions: [instructionSchema],
    cookingTime: cookingTimeSchema,
    servings: { type: Number, default: 2 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    cuisine: { type: String, default: 'International', trim: true },
    tags: [{ type: String, trim: true }], // vegetarian, quick, healthy, etc.
    nutrition: nutritionSchema,
    substitutions: [substitutionSchema],

    // AI metadata
    isAiGenerated: { type: Boolean, default: true },
    generatedFrom: [{ type: String }], // The ingredients user submitted
    aiModel: { type: String, default: 'gpt-4o-mini' },

    // User association
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: { type: Boolean, default: false },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savesCount: { type: Number, default: 0 },

    // Image (AI-generated or user uploaded)
    image: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Formatted Cooking Time ──────────────────────────────────────────
recipeSchema.virtual('cookingTimeFormatted').get(function () {
  const total = this.cookingTime?.total || 0;
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
recipeSchema.index({ createdBy: 1, createdAt: -1 });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ 'cookingTime.total': 1 });
recipeSchema.index({ 'nutrition.calories': 1 });
recipeSchema.index({ generatedFrom: 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
