import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import { useRecipes } from '../context/RecipeContext';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import MealPlanner from '../components/MealPlanner';

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'halal', 'kosher'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { savedRecipes, savedMeta } = useRecipes();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    dietaryPreferences: user?.dietaryPreferences || [],
    cookingSkillLevel: user?.cookingSkillLevel || 'intermediate',
    allergies: user?.allergies || [],
  });
  const [allergyInput, setAllergyInput] = useState('');

  const toggleDietary = (pref) => {
    setProfile(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  };

  const addAllergy = (e) => {
    if (e.key === 'Enter' && allergyInput.trim()) {
      setProfile(prev => ({ ...prev, allergies: [...prev.allergies, allergyInput.trim().toLowerCase()] }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (a) => {
    setProfile(prev => ({ ...prev, allergies: prev.allergies.filter(x => x !== a) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authService.updateProfile(profile);
      if (res.success) {
        updateUser(res.data);
        toast.success('Profile updated! ✅');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const stats = [
    { icon: '✨', label: 'Recipes Generated', value: user?.stats?.recipesGenerated || 0, color: 'text-primary-400' },
    { icon: '❤️', label: 'Recipes Saved', value: user?.stats?.recipesSaved || 0, color: 'text-red-400' },
    { icon: '🤖', label: 'Chat Messages', value: user?.stats?.chatMessages || 0, color: 'text-blue-400' },
    { icon: '📅', label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—', color: 'text-accent-400' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 pt-16">
      <div className="page-container py-10">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-white mb-8">
          Dashboard 📊
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6">
              <div className="text-center mb-6">
                <img
                  src={user?.avatarUrl}
                  alt={user?.name}
                  className="w-20 h-20 rounded-2xl mx-auto mb-3 object-cover border-2 border-primary-500/30"
                />
                <h2 className="font-display text-xl font-bold text-white">{user?.name}</h2>
                <p className="text-dark-500 text-sm">{user?.email}</p>
                <span className="badge-green mt-2 capitalize">{user?.cookingSkillLevel || 'intermediate'} cook</span>
              </div>

              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn-secondary w-full text-sm">
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs text-dark-400 block mb-1">Name</label>
                    <input type="text" value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      className="input-field text-sm" />
                  </div>

                  {/* Skill */}
                  <div>
                    <label className="text-xs text-dark-400 block mb-1">Cooking Skill</label>
                    <div className="flex gap-2">
                      {SKILL_LEVELS.map(s => (
                        <button key={s} onClick={() => setProfile(p => ({ ...p, cookingSkillLevel: s }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all
                            ${profile.cookingSkillLevel === s ? 'bg-primary-600 border-primary-600 text-white' : 'bg-dark-800 border-dark-700 text-dark-400'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary */}
                  <div>
                    <label className="text-xs text-dark-400 block mb-1">Dietary Preferences</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DIETARY_OPTIONS.map(p => (
                        <button key={p} onClick={() => toggleDietary(p)}
                          className={`px-2 py-1 rounded-lg text-xs border capitalize transition-all
                            ${profile.dietaryPreferences.includes(p) ? 'bg-primary-500/15 border-primary-500/30 text-primary-400' : 'bg-dark-800 border-dark-700 text-dark-500'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="text-xs text-dark-400 block mb-1">Allergies</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {profile.allergies.map(a => (
                        <span key={a} className="badge-red text-xs flex items-center gap-1">
                          {a}
                          <button onClick={() => removeAllergy(a)} className="hover:text-white">×</button>
                        </span>
                      ))}
                    </div>
                    <input type="text" value={allergyInput}
                      onChange={e => setAllergyInput(e.target.value)}
                      onKeyDown={addAllergy}
                      placeholder="Type allergy, press Enter"
                      className="input-field text-sm" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={isSaving}
                      className="btn-primary flex-1 text-sm py-2">
                      {isSaving ? <Spinner size="sm" color="white" /> : 'Save'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm py-2 px-3">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column: Stats + Meal Planner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={stat.label} className="glass-card p-4 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className={`font-display text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-dark-500 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Weekly Meal Planner — fully interactive */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              <MealPlanner />
            </motion.div>

            {/* Dietary preferences display */}
            {user?.dietaryPreferences?.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="glass-card p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><span>🥗</span> Dietary Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {user.dietaryPreferences.map(p => (
                    <span key={p} className="badge-green capitalize">{p}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
