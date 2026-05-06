import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRecipes } from '../../context/RecipeContext';
import Modal from '../ui/Modal';
import NutritionChart from './NutritionChart';

const DIFFICULTY_COLORS = {
  easy: 'badge-green',
  medium: 'badge-amber',
  hard: 'badge-red',
};

const CUISINE_EMOJIS = {
  Italian: '🍝', Asian: '🥢', Indian: '🍛', Mexican: '🌮',
  American: '🍔', French: '🥐', Mediterranean: '🫒', International: '🌍',
};

export default function RecipeCard({ recipe, index = 0, showSaveButton = true }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { saveRecipe, isSaving } = useRecipes();

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isSaved) return;
    const result = await saveRecipe(recipe);
    if (result.success) setIsSaved(true);
  };

  const cuisineEmoji = CUISINE_EMOJIS[recipe.cuisine] || '🍽️';
  const totalTime = recipe.cookingTime?.total || 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        onClick={() => setIsModalOpen(true)}
        className="glass-card-hover cursor-pointer group overflow-hidden">

        {/* Header gradient */}
        <div className="h-32 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${(index * 60 + 120)}, 50%, 15%) 0%, 
              hsl(${(index * 60 + 160)}, 40%, 10%) 100%)`,
          }}>
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-40 group-hover:opacity-60 transition-opacity group-hover:scale-110 duration-300 transform">
            {cuisineEmoji}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <span className={`badge ${DIFFICULTY_COLORS[recipe.difficulty] || 'badge-green'} capitalize`}>
              {recipe.difficulty}
            </span>
          </div>
          {recipe.tags?.includes('vegetarian') && (
            <div className="absolute top-3 left-3">
              <span className="badge-green badge text-xs">🌱 Veg</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-display font-bold text-white text-lg leading-tight mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
            {recipe.title}
          </h3>
          <p className="text-dark-400 text-sm leading-relaxed line-clamp-2 mb-4">
            {recipe.description}
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-dark-400">
              <div className="flex items-center gap-1">
                <span>⏱️</span>
                <span>{totalTime < 60 ? `${totalTime}m` : `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>👥</span>
                <span>{recipe.servings || 2}</span>
              </div>
              {recipe.nutrition?.calories > 0 && (
                <div className="flex items-center gap-1">
                  <span>🔥</span>
                  <span>{recipe.nutrition.calories} cal</span>
                </div>
              )}
            </div>

            {showSaveButton && (
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isSaved
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                    : 'bg-dark-700 text-dark-300 hover:bg-primary-500/10 hover:text-primary-400 border border-transparent hover:border-primary-500/20'
                  }`}>
                {isSaved ? '✅ Saved' : isSaving ? '...' : '❤️ Save'}
              </button>
            )}
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-dark-700/50">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full capitalize">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Recipe Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <RecipeModalContent recipe={recipe} onSave={handleSave} isSaved={isSaved} isSaving={isSaving} />
      </Modal>
    </>
  );
}

// Extracted modal content component
function RecipeModalContent({ recipe, onSave, isSaved, isSaving }) {
  const [activeTab, setActiveTab] = useState('instructions');

  const tabs = [
    { id: 'instructions', label: 'Instructions' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'substitutions', label: 'Substitutions' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-white mb-2">{recipe.title}</h2>
          <p className="text-dark-400 leading-relaxed">{recipe.description}</p>
        </div>
        {!isSaved && (
          <button onClick={onSave} disabled={isSaving}
            className="btn-primary ml-4 flex-shrink-0 text-sm">
            {isSaving ? 'Saving...' : '❤️ Save Recipe'}
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: '⏱️', label: 'Total', value: `${recipe.cookingTime?.total || '?'} min` },
          { icon: '🍳', label: 'Cook', value: `${recipe.cookingTime?.cook || '?'} min` },
          { icon: '👥', label: 'Serves', value: recipe.servings || 2 },
          { icon: '📊', label: 'Difficulty', value: recipe.difficulty || 'Medium', capitalize: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-dark-800 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className={`text-white font-semibold text-sm ${stat.capitalize ? 'capitalize' : ''}`}>{stat.value}</div>
            <div className="text-dark-500 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'instructions' && (
        <div className="space-y-4">
          {(recipe.instructions || []).map((inst) => (
            <div key={inst.step} className="flex gap-4 p-4 bg-dark-800/50 rounded-xl">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {inst.step}
              </div>
              <div className="flex-1">
                <p className="text-dark-200 leading-relaxed">{inst.description}</p>
                {inst.duration && <p className="text-primary-400 text-xs mt-1.5">⏱️ {inst.duration}</p>}
                {inst.tip && <p className="text-accent-400 text-xs mt-1.5 flex items-start gap-1"><span>💡</span>{inst.tip}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(recipe.ingredients || []).map((ing, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
              <span className="text-dark-200 text-sm">
                {ing.amount && <strong className="text-white">{ing.amount} {ing.unit} </strong>}
                {ing.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'nutrition' && (
        <NutritionChart nutrition={recipe.nutrition} />
      )}

      {activeTab === 'substitutions' && (
        <div className="space-y-4">
          {recipe.substitutions && recipe.substitutions.length > 0 ? (
            recipe.substitutions.map((sub, i) => (
              <div key={i} className="p-4 bg-dark-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-400 font-medium">🔴 {sub.original}</span>
                  <span className="text-dark-500">→</span>
                  <span className="text-primary-400 font-medium">alternatives</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {sub.alternatives?.map((alt, j) => (
                    <span key={j} className="badge-green text-xs">{alt}</span>
                  ))}
                </div>
                {sub.note && <p className="text-dark-500 text-xs">💡 {sub.note}</p>}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-dark-500">
              <span className="text-3xl block mb-2">🔄</span>
              No substitutions available for this recipe.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
