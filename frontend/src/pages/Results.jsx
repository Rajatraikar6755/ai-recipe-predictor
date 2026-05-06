import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRecipes } from '../context/RecipeContext';
import RecipeCard from '../components/recipe/RecipeCard';
import Spinner from '../components/ui/Spinner';

export default function Results() {
  const { generatedRecipes, generatedFrom, isGenerating, isFallback, clearGenerated } = useRecipes();
  const navigate = useNavigate();

  // Redirect if no recipes and not generating
  useEffect(() => {
    if (!isGenerating && generatedRecipes.length === 0) {
      navigate('/home');
    }
  }, [generatedRecipes, isGenerating, navigate]);

  const handleNewSearch = () => {
    clearGenerated();
    navigate('/home');
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Spinner size="xl" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🍳</div>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Crafting your recipes...</h2>
          <p className="text-dark-400">AI is working its magic</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 pt-16">
      <div className="page-container py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                {generatedRecipes.length} Recipe{generatedRecipes.length !== 1 ? 's' : ''} Found ✨
              </h1>
              {generatedFrom.length > 0 && (
                <p className="text-dark-400 text-sm">
                  Based on: <span className="text-primary-400">{generatedFrom.join(', ')}</span>
                </p>
              )}
            </div>
            <button onClick={handleNewSearch} className="btn-secondary text-sm">
              ← New Search
            </button>
          </div>

          {/* Fallback warning */}
          {isFallback && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-amber-400 font-medium text-sm">Showing sample recipes</p>
                <p className="text-dark-400 text-xs mt-0.5">AI generation is temporarily unavailable. Check your GitHub token and try again.</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recipe Grid */}
        {generatedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedRecipes.map((recipe, index) => (
              <RecipeCard key={index} recipe={recipe} index={index} showSaveButton />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-dark-400 text-lg">No recipes to display.</p>
            <button onClick={handleNewSearch} className="btn-primary mt-4">Try Again</button>
          </div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button onClick={handleNewSearch} className="btn-primary">
            ✨ Generate More Recipes
          </button>
          <button onClick={() => navigate('/saved')} className="btn-secondary">
            ❤️ View Saved Recipes
          </button>
        </motion.div>
      </div>
    </div>
  );
}
