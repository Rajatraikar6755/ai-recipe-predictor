import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mealPlanService } from '../services';
import { useRecipes } from '../context/RecipeContext';
import toast from 'react-hot-toast';
import Spinner from './ui/Spinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };

// Build current week's Monday date
const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const EMPTY_SLOT = { recipeId: null, customMeal: '', notes: '' };

const buildEmptyWeek = () =>
  DAYS.map((day) => ({
    day,
    breakfast: { ...EMPTY_SLOT },
    lunch: { ...EMPTY_SLOT },
    dinner: { ...EMPTY_SLOT },
    snacks: [],
  }));

export default function MealPlanner() {
  const [weekStart] = useState(getWeekStart());
  const [days, setDays] = useState(buildEmptyWeek());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state for editing a cell
  const [editCell, setEditCell] = useState(null); // { dayIndex, mealType }
  const { savedRecipes, fetchSavedRecipes } = useRecipes();
  const [cellDraft, setCellDraft] = useState({ customMeal: '', notes: '', recipeId: null, recipeTitle: '' });

  // Load meal plan from API
  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      try {
        const res = await mealPlanService.getMealPlan(weekStart.toISOString());
        if (res.success) {
          if (res.data.mealPlan?.days?.length > 0) {
            const normalizedDays = res.data.mealPlan.days.map(d => ({
              ...d,
              breakfast: { ...d.breakfast, recipeId: d.breakfast.recipeId?._id || d.breakfast.recipeId },
              lunch: { ...d.lunch, recipeId: d.lunch.recipeId?._id || d.lunch.recipeId },
              dinner: { ...d.dinner, recipeId: d.dinner.recipeId?._id || d.dinner.recipeId },
              snacks: (d.snacks || []).map(s => ({ ...s, recipeId: s.recipeId?._id || s.recipeId })),
            }));
            setDays(normalizedDays);
          } else if (res.data.template) {
            setDays(res.data.template);
          }
        }
      } catch {
        // Start fresh if no plan
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, []);

  // Ensure saved recipes are loaded
  useEffect(() => {
    if (savedRecipes.length === 0) {
      fetchSavedRecipes({ limit: 50 });
    }
  }, []);

  // Save entire plan to API
  const savePlan = async (updatedDays) => {
    setIsSaving(true);
    try {
      await mealPlanService.updateMealPlan({
        weekStart: weekStart.toISOString(),
        days: updatedDays,
      });
      toast.success('Meal plan saved! 📅');
    } catch {
      toast.error('Failed to save meal plan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open editor for a specific cell
  const openEditor = (dayIndex, mealType) => {
    const slot = days[dayIndex][mealType];
    const matchingRecipe = savedRecipes.find(r => r._id === slot.recipeId);
    setCellDraft({
      customMeal: slot.customMeal || '',
      notes: slot.notes || '',
      recipeId: slot.recipeId || null,
      recipeTitle: matchingRecipe?.title || '',
    });
    setEditCell({ dayIndex, mealType });
  };

  // Apply draft to the cell and save
  const applyEdit = async () => {
    if (!editCell) return;
    const { dayIndex, mealType } = editCell;

    const updatedDays = days.map((d, i) => {
      if (i !== dayIndex) return d;
      return {
        ...d,
        [mealType]: {
          recipeId: cellDraft.recipeId || null,
          customMeal: cellDraft.customMeal,
          notes: cellDraft.notes,
        },
      };
    });

    setDays(updatedDays);
    setEditCell(null);
    await savePlan(updatedDays);
  };

  // Clear a single cell
  const clearCell = async (dayIndex, mealType) => {
    const updatedDays = days.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, [mealType]: { ...EMPTY_SLOT } };
    });
    setDays(updatedDays);
    await savePlan(updatedDays);
  };

  // Clear entire week
  const clearWeek = async () => {
    if (!window.confirm(`Clear the entire week's meal plan?`)) return;
    const empty = buildEmptyWeek();
    setDays(empty);
    try {
      await mealPlanService.clearMealPlan(weekStart.toISOString());
      toast.success('Week cleared!');
    } catch {
      toast.error('Could not clear meal plan.');
    }
  };

  const getCellLabel = (slot) => {
    if (!slot) return null;
    const recipe = savedRecipes.find(r => r._id === slot.recipeId);
    if (recipe) return recipe.title;
    if (slot.customMeal) return slot.customMeal;
    return null;
  };

  const weekLabel = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <span>📅</span> Weekly Meal Planner
            </h3>
            <p className="text-dark-500 text-xs mt-0.5">Week of {weekLabel} · Click any cell to add a meal</p>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Spinner size="sm" />}
            <button onClick={clearWeek}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all">
              🗑️ Clear Week
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr>
                <th className="text-left text-dark-500 text-xs font-medium pb-3 w-20">Day</th>
                {MEAL_TYPES.map(m => (
                  <th key={m} className="text-center text-dark-500 text-xs font-medium pb-3 px-2 capitalize">
                    {MEAL_ICONS[m]} {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((dayPlan, dayIndex) => (
                <tr key={dayPlan.day} className={dayIndex < DAYS.length - 1 ? 'border-b border-dark-800' : ''}>
                  <td className="py-2 pr-3">
                    <span className="text-dark-300 text-sm font-semibold">{dayPlan.day.slice(0, 3)}</span>
                  </td>
                  {MEAL_TYPES.map(meal => {
                    const slot = dayPlan[meal];
                    const label = getCellLabel(slot);
                    return (
                      <td key={meal} className="py-2 px-1.5">
                        <div
                          onClick={() => openEditor(dayIndex, meal)}
                          className={`min-h-[42px] rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-1 px-2.5 py-1.5 group
                            ${label
                              ? 'bg-primary-500/8 border-primary-500/25 text-primary-300 hover:bg-primary-500/15'
                              : 'border-dashed border-dark-700 text-dark-600 hover:border-primary-500/30 hover:text-dark-400 hover:bg-dark-800/50'
                            }`}>
                          <span className="line-clamp-2 leading-tight flex-1">
                            {label || <span className="text-dark-700">+ Add meal</span>}
                          </span>
                          {label && (
                            <button
                              onClick={(e) => { e.stopPropagation(); clearCell(dayIndex, meal); }}
                              className="opacity-0 group-hover:opacity-100 text-dark-500 hover:text-red-400 transition-all flex-shrink-0 text-base leading-none">
                              ×
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-dark-700 text-xs mt-3 text-center">
          Click a cell to type a custom meal or pick from your saved recipes
        </p>
      </div>

      {/* Edit Cell Modal */}
      <AnimatePresence>
        {editCell && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setEditCell(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative glass-card w-full max-w-md p-6 z-10"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>

              <h3 className="font-display font-bold text-white mb-1">
                {MEAL_ICONS[editCell.mealType]} {days[editCell.dayIndex].day} — {editCell.mealType}
              </h3>
              <p className="text-dark-500 text-xs mb-5">Pick a saved recipe or type a custom meal</p>

              {/* Saved recipe picker */}
              {savedRecipes.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-dark-400 block mb-2">From saved recipes</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 scroll-area pr-1">
                    {savedRecipes.map(r => (
                      <button
                        key={r._id}
                        onClick={() => setCellDraft(d => ({ ...d, recipeId: r._id, recipeTitle: r.title, customMeal: '' }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all
                          ${cellDraft.recipeId === r._id
                            ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                            : 'bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-600'
                          }`}>
                        {r.title}
                        {r.cookingTime?.total && (
                          <span className="text-dark-500 ml-2 text-xs">⏱ {r.cookingTime.total}m</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* OR divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-dark-700" />
                <span className="text-dark-600 text-xs">or type custom</span>
                <div className="flex-1 h-px bg-dark-700" />
              </div>

              {/* Custom meal */}
              <div className="mb-3">
                <input
                  type="text"
                  value={cellDraft.customMeal}
                  onChange={e => setCellDraft(d => ({ ...d, customMeal: e.target.value, recipeId: null, recipeTitle: '' }))}
                  placeholder="e.g. Oatmeal with fruits..."
                  className="input-field text-sm w-full"
                />
              </div>

              {/* Notes */}
              <div className="mb-5">
                <input
                  type="text"
                  value={cellDraft.notes}
                  onChange={e => setCellDraft(d => ({ ...d, notes: e.target.value }))}
                  placeholder="Notes (optional)..."
                  className="input-field text-sm w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={applyEdit}
                  disabled={!cellDraft.recipeId && !cellDraft.customMeal.trim()}
                  className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-40">
                  ✅ Save Meal
                </button>
                <button onClick={() => setEditCell(null)} className="btn-secondary py-2.5 px-4 text-sm">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
