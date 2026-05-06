import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useRecipes } from '../context/RecipeContext';
import { recipeService } from '../services';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: '🌱 Vegetarian' },
  { id: 'vegan', label: '🥦 Vegan' },
  { id: 'gluten-free', label: '🌾 Gluten-Free' },
  { id: 'dairy-free', label: '🥛 Dairy-Free' },
  { id: 'keto', label: '🥑 Keto' },
  { id: 'paleo', label: '🦴 Paleo' },
];

const SUGGESTION_SETS = [
  ['chicken', 'rice', 'garlic', 'lemon', 'spinach'],
  ['pasta', 'tomatoes', 'basil', 'mozzarella', 'olive oil'],
  ['eggs', 'cheese', 'bread', 'butter', 'herbs'],
  ['tofu', 'broccoli', 'soy sauce', 'ginger', 'sesame'],
];

export default function Home() {
  const { user } = useAuth();
  const { generateRecipes, isGenerating } = useRecipes();
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [maxTime, setMaxTime] = useState(60);
  const [recipeCount, setRecipeCount] = useState(3);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // Accumulates final (committed) speech across interim bursts
  const finalTranscriptRef = useRef('');

  const addIngredient = (val) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed || ingredients.includes(trimmed) || ingredients.length >= 20) return;
    setIngredients(prev => [...prev, trimmed]);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngredient(inputValue);
      setInputValue('');
    }
    if (e.key === 'Backspace' && !inputValue && ingredients.length > 0) {
      setIngredients(prev => prev.slice(0, -1));
    }
  };

  const removeIngredient = (ing) => {
    setIngredients(prev => prev.filter(i => i !== ing));
  };

  // ── Auto-add words from the final transcript as ingredient tags ──────────
  const commitVoiceTranscript = (transcript) => {
    if (!transcript.trim()) return;
    // Split on comma / "and" / whitespace — each word becomes a tag
    const parts = transcript.trim().split(/[,\s]+(?:and\s+)?|(?:\s+and\s+)/i).filter(Boolean);
    parts.forEach(addIngredient);
    toast.success(`🎙️ Added: ${parts.join(', ')}`);
  };

  const toggleDietary = (id) => {
    setDietaryFilters(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  // Image upload
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setIsAnalyzingImage(true);
    const formData = new FormData();
    formData.append('image', acceptedFiles[0]);

    try {
      const res = await recipeService.analyzeImage(formData);
      if (res.success && res.data.ingredients?.length > 0) {
        res.data.ingredients.forEach(addIngredient);
        toast.success(`Found ${res.data.ingredients.length} ingredients! 🎉`);
      } else {
        toast('Could not detect ingredients. Please type them manually.', { icon: '📷' });
      }
    } catch {
      toast.error('Image analysis failed. Please type ingredients manually.');
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [ingredients]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    multiple: false,
  });

  // Voice input — fully working with live text-in-box
  const toggleVoice = () => {
    // Browser support check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input requires Chrome or Edge browser.');
      return;
    }

    // If already listening — stop and commit
    if (isListening) {
      recognitionRef.current?.stop();
      return; // onend will handle state + commit
    }

    // Reset accumulated transcript
    finalTranscriptRef.current = '';
    setInputValue('');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;        // keep listening until user stops
    recognition.interimResults = true;    // show live text as user speaks
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // ── Live transcription into the input box ────────────────────────────
    recognition.onresult = (event) => {
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Committed word — append to accumulated final
          finalTranscriptRef.current += result[0].transcript + ' ';
        } else {
          // Still speaking — show as interim
          interimText += result[0].transcript;
        }
      }

      // Show final + interim combined in the input box (live preview)
      setInputValue((finalTranscriptRef.current + interimText).trim());
    };

    // ── Error handling — specific messages for each error code ───────────
    recognition.onerror = (event) => {
      console.warn('Speech recognition error code:', event.error);

      // 'aborted' fires when we call .stop() ourselves — not a real error
      if (event.error === 'aborted') return;

      let msg = 'Voice recognition failed. Please try again.';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        msg = '🎙️ Microphone access denied. Click the 🔒 icon in your browser address bar and allow microphone, then try again.';
      } else if (event.error === 'no-speech') {
        msg = 'No speech detected. Please speak clearly and try again.';
      } else if (event.error === 'network') {
        msg = 'Network error during voice recognition. Check your internet connection.';
      } else if (event.error === 'audio-capture') {
        msg = 'No microphone found. Please connect a microphone and try again.';
      } else if (event.error === 'service-not-allowed') {
        msg = 'Speech service not allowed. Try using HTTPS or allow in browser settings.';
      }

      toast.error(msg, { duration: 5000 });
      setIsListening(false);
      setInputValue('');
      finalTranscriptRef.current = '';
    };

    // ── When recognition ends — commit words as ingredient tags ──────────
    recognition.onend = () => {
      setIsListening(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        commitVoiceTranscript(finalText);
        setInputValue('');   // clear input box after tags are added
        finalTranscriptRef.current = '';
      }
    };

    // ── Start listening ──────────────────────────────────────────────────
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      toast('🎙️ Listening… Say your ingredients, then click Stop', {
        duration: 4000,
        icon: '🟢',
      });
    } catch (err) {
      console.error('Could not start speech recognition:', err);
      toast.error('Could not start microphone. Is another app using it?');
    }
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient.');
      return;
    }

    const result = await generateRecipes({
      ingredients,
      filters: {
        dietary: dietaryFilters,
        maxCookingTime: maxTime,
        servings: 2,
      },
      count: recipeCount,
    });

    if (result?.success) {
      navigate('/results');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-16">
      <div className="page-container py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-white mb-3">
            What's in your <span className="gradient-text">kitchen?</span>
          </h1>
          <p className="text-dark-400">
            Add your leftover ingredients and let AI craft the perfect recipe
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Ingredient Input */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span>🥬</span> Ingredients
                <span className="text-dark-500 font-normal text-sm">({ingredients.length}/20)</span>
              </h2>
              <div className="flex gap-2">
                {/* Voice button */}
                <button
                  onClick={toggleVoice}
                  title={isListening ? 'Click to stop recording' : 'Click to speak ingredients'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    isListening
                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                      : 'border-dark-600 text-dark-400 hover:text-white hover:border-primary-500/40 hover:bg-primary-500/5'
                  }`}>
                  {isListening ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      Stop
                    </>
                  ) : (
                    <><span>🎙️</span> Voice</>
                  )}
                </button>
              </div>
            </div>

            {/* Ingredient tags + input */}
            <div className="flex flex-wrap gap-2 min-h-[48px] bg-dark-800 rounded-xl p-3 cursor-text"
              onClick={() => document.getElementById('ing-input')?.focus()}>
              {ingredients.map((ing) => (
                <motion.span key={ing}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="ingredient-tag">
                  {ing}
                  <button onClick={(e) => { e.stopPropagation(); removeIngredient(ing); }}
                    className="ml-1 text-primary-400 hover:text-red-400 transition-colors leading-none">×</button>
                </motion.span>
              ))}
              <input
                id="ing-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => { if (inputValue.trim()) { addIngredient(inputValue); setInputValue(''); } }}
                placeholder={ingredients.length === 0 ? "Type an ingredient, press Enter or comma..." : "Add more..."}
                className="bg-transparent text-white placeholder-dark-500 text-sm flex-1 min-w-[180px] outline-none"
              />
            </div>
            {/* Listening indicator */}
            {isListening ? (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-400 animate-pulse">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                Listening — speak your ingredients, they'll appear above. Click <strong className="text-red-300 mx-1">Stop</strong> when done.
              </div>
            ) : (
              <p className="text-dark-600 text-xs mt-2">Press Enter or comma to add · or click 🎙️ Voice to speak</p>
            )}

            {/* Quick suggestions */}
            <div className="mt-4">
              <p className="text-dark-500 text-xs mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_SETS.map((set, i) => (
                  <button key={i} onClick={() => set.forEach(addIngredient)}
                    className="text-xs bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700 px-3 py-1.5 rounded-full border border-dark-700 transition-all">
                    {set.slice(0, 3).join(', ')}...
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Image Upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 
              ${isDragActive ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 hover:border-dark-500 hover:bg-dark-900/50'}`}>
              <input {...getInputProps()} />
              {isAnalyzingImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="md" />
                  <p className="text-dark-400 text-sm">Analyzing image with AI...</p>
                </div>
              ) : (
                <>
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-dark-300 text-sm font-medium">
                    {isDragActive ? 'Drop your image here!' : 'Drag & drop a photo of your ingredients'}
                  </p>
                  <p className="text-dark-500 text-xs mt-1">or click to browse · JPG, PNG, WebP · Max 5MB</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden">
            <button onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between p-5 text-left">
              <span className="font-semibold text-white flex items-center gap-2">
                <span>⚙️</span> Filters & Preferences
                {(dietaryFilters.length > 0) && (
                  <span className="badge-green">{dietaryFilters.length} active</span>
                )}
              </span>
              <motion.span animate={{ rotate: showFilters ? 180 : 0 }} className="text-dark-400">▼</motion.span>
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-dark-700/50">
                  <div className="p-5 space-y-5">
                    {/* Dietary */}
                    <div>
                      <label className="text-sm font-medium text-dark-300 mb-3 block">Dietary Restrictions</label>
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => toggleDietary(opt.id)}
                            className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                              dietaryFilters.includes(opt.id)
                                ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                                : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Max time */}
                    <div>
                      <label className="text-sm font-medium text-dark-300 mb-2 flex justify-between">
                        <span>Max Cooking Time</span>
                        <span className="text-primary-400">{maxTime} minutes</span>
                      </label>
                      <input type="range" min="10" max="180" step="10" value={maxTime}
                        onChange={e => setMaxTime(Number(e.target.value))}
                        className="w-full accent-primary-500" />
                      <div className="flex justify-between text-xs text-dark-600 mt-1">
                        <span>10 min</span><span>3 hours</span>
                      </div>
                    </div>

                    {/* Recipe count */}
                    <div>
                      <label className="text-sm font-medium text-dark-300 mb-2 block">Number of Recipes</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setRecipeCount(n)}
                            className={`w-10 h-10 rounded-xl font-semibold text-sm border transition-all ${
                              recipeCount === n
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600'
                            }`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Generate Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleGenerate}
            disabled={isGenerating || ingredients.length === 0}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3">
            {isGenerating ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Generating your recipes...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate {recipeCount} Recipe{recipeCount > 1 ? 's' : ''}</span>
                <span className="text-primary-300 text-sm">{ingredients.length > 0 ? `from ${ingredients.length} ingredients` : ''}</span>
              </>
            )}
          </motion.button>

          {/* Loading state message */}
          {isGenerating && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-dark-500 text-sm">
              🤖 AI is crafting personalized recipes for you... This may take 10-20 seconds.
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
