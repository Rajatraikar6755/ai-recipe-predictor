const MealPlan = require('../models/MealPlan');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Get start of current week (Monday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── GET /api/mealplan ────────────────────────────────────────────────────────
const getMealPlan = async (req, res, next) => {
  try {
    const { weekStart } = req.query;
    const targetWeek = weekStart ? new Date(weekStart) : getWeekStart();

    let mealPlan = await MealPlan.findOne({
      userId: req.user._id,
      weekStart: targetWeek,
    }).populate('days.breakfast.recipeId days.lunch.recipeId days.dinner.recipeId', 'title cookingTime nutrition tags');

    // If no plan exists, return empty template
    if (!mealPlan) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return sendSuccess(res, 200, 'No meal plan found for this week', {
        mealPlan: null,
        weekStart: targetWeek,
        template: days.map((day) => ({
          day,
          breakfast: { recipeId: null, customMeal: '', notes: '' },
          lunch: { recipeId: null, customMeal: '', notes: '' },
          dinner: { recipeId: null, customMeal: '', notes: '' },
          snacks: [],
        })),
      });
    }

    return sendSuccess(res, 200, 'Meal plan fetched', { mealPlan });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/mealplan ────────────────────────────────────────────────────────
const updateMealPlan = async (req, res, next) => {
  try {
    const { weekStart, days, totalCaloriesTarget, notes } = req.body;

    const mealPlan = await MealPlan.findOneAndUpdate(
      { userId: req.user._id, weekStart: new Date(weekStart) },
      {
        userId: req.user._id,
        weekStart: new Date(weekStart),
        days,
        ...(totalCaloriesTarget && { totalCaloriesTarget }),
        ...(notes !== undefined && { notes }),
      },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, 200, 'Meal plan updated successfully!', { mealPlan });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/mealplan ─────────────────────────────────────────────────────
const clearMealPlan = async (req, res, next) => {
  try {
    const { weekStart } = req.query;

    if (!weekStart) {
      return sendError(res, 400, 'weekStart query parameter is required.');
    }

    const deleted = await MealPlan.findOneAndDelete({
      userId: req.user._id,
      weekStart: new Date(weekStart),
    });

    if (!deleted) {
      return sendError(res, 404, 'No meal plan found for this week.');
    }

    return sendSuccess(res, 200, 'Meal plan cleared.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMealPlan, updateMealPlan, clearMealPlan };
