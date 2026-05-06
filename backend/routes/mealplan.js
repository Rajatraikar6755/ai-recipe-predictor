const express = require('express');
const router = express.Router();
const { getMealPlan, updateMealPlan, clearMealPlan } = require('../controllers/mealPlanController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validators');

router.use(protect);

// GET /api/mealplan?weekStart=YYYY-MM-DD
router.get('/', getMealPlan);

// PUT /api/mealplan
router.put('/', validate(schemas.mealPlanUpdateSchema), updateMealPlan);

// DELETE /api/mealplan?weekStart=YYYY-MM-DD
router.delete('/', clearMealPlan);

module.exports = router;
