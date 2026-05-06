const mongoose = require('mongoose');

const mealSlotSchema = new mongoose.Schema({
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null,
  },
  customMeal: { type: String, default: '' }, // Free text if no saved recipe
  notes: { type: String, default: '' },
  _id: false,
});

const dayPlanSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  breakfast: mealSlotSchema,
  lunch: mealSlotSchema,
  dinner: mealSlotSchema,
  snacks: [mealSlotSchema],
  _id: false,
});

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    days: [dayPlanSchema],
    notes: { type: String, default: '' },
    totalCaloriesTarget: { type: Number, default: 2000 },
  },
  {
    timestamps: true,
  }
);

// Ensure one meal plan per user per week
mealPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
