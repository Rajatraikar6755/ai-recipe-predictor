import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipes } from '../context/RecipeContext';
import { useNavigate } from 'react-router-dom';
import RecipeCard from '../components/recipe/RecipeCard';
import Spinner from '../components/ui/Spinner';

const SORT_OPTIONS = [
  { value: 'newest', label: '📅 Newest' },
  { value: 'oldest', label: '🕰️ Oldest' },
  { value: 'calories-asc', label: '🔥 Low Calories' },
  { value: 'calories-desc', label: '🔥 High Calories' },
  { value: 'time-asc', label: '⏱️ Quick First' },
];

export default function SavedRecipes() {
  const { savedRecipes, savedMeta, isLoadingSaved, fetchSavedRecipes, deleteRecipe } = useRecipes();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSavedRecipes({ page, sort, search: search || undefined });
  }, [page, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSavedRecipes({ page: 1, sort, search: search || undefined });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    setDeletingId(id);
    await deleteRecipe(id);
    setDeletingId(null);
    fetchSavedRecipes({ page, sort });
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-16">
      <div className="page-container py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-white mb-1">
                My Recipes ❤️
              </h1>
              <p className="text-dark-400 text-sm">
                {savedMeta?.total || 0} saved recipe{savedMeta?.total !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={() => navigate('/home')} className="btn-primary text-sm">
              ✨ Generate More
            </button>
          </div>
        </motion.div>

        {/* Search & Filter bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary px-4 py-2 text-sm">Search</button>
          </form>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-48 text-sm">
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </motion.div>

        {/* Content */}
        {isLoadingSaved ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : savedRecipes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">No saved recipes yet</h2>
            <p className="text-dark-400 mb-6">Generate recipes and save your favorites here</p>
            <button onClick={() => navigate('/home')} className="btn-primary">
              ✨ Generate Recipes
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {savedRecipes.map((recipe, i) => (
                  <motion.div key={recipe._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative group">
                    <RecipeCard recipe={recipe} index={i} showSaveButton={false} />
                    {/* Delete button overlay */}
                    <button
                      onClick={() => handleDelete(recipe._id)}
                      disabled={deletingId === recipe._id}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity
                        bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-lg text-xs font-medium">
                      {deletingId === recipe._id ? '...' : '🗑️'}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {savedMeta?.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!savedMeta.hasPrevPage}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">
                  ← Prev
                </button>
                <span className="flex items-center px-4 text-dark-400 text-sm">
                  Page {savedMeta.page} of {savedMeta.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!savedMeta.hasNextPage}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
