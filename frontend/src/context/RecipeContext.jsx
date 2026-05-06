import { createContext, useContext, useReducer, useCallback } from 'react';
import { recipeService } from '../services';
import toast from 'react-hot-toast';

const RecipeContext = createContext(null);

const initialState = {
  generatedRecipes: [],
  savedRecipes: [],
  savedMeta: null,
  selectedRecipe: null,
  generatedFrom: [],
  isGenerating: false,
  isSaving: false,
  isLoadingSaved: false,
  error: null,
  isFallback: false,
};

const recipeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload, error: null };
    case 'SET_GENERATED':
      return {
        ...state,
        generatedRecipes: action.payload.recipes,
        generatedFrom: action.payload.generatedFrom,
        isFallback: action.payload.isFallback || false,
        isGenerating: false,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isGenerating: false, isLoadingSaved: false };
    case 'SET_SAVED_RECIPES':
      return { ...state, savedRecipes: action.payload.data, savedMeta: action.payload.meta, isLoadingSaved: false };
    case 'SET_LOADING_SAVED':
      return { ...state, isLoadingSaved: action.payload };
    case 'ADD_SAVED_RECIPE': {
      const exists = state.savedRecipes.some((r) => r._id === action.payload._id);
      return {
        ...state,
        savedRecipes: exists ? state.savedRecipes : [action.payload, ...state.savedRecipes],
        isSaving: false,
      };
    }
    case 'REMOVE_SAVED_RECIPE':
      return {
        ...state,
        savedRecipes: state.savedRecipes.filter((r) => r._id !== action.payload),
      };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SELECT_RECIPE':
      return { ...state, selectedRecipe: action.payload };
    case 'CLEAR_GENERATED':
      return { ...state, generatedRecipes: [], generatedFrom: [], isFallback: false };
    default:
      return state;
  }
};

export const RecipeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  const generateRecipes = useCallback(async ({ ingredients, filters, count = 3 }) => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    try {
      const res = await recipeService.generateRecipes({ ingredients, filters, count });
      if (res.success) {
        dispatch({
          type: 'SET_GENERATED',
          payload: {
            recipes: res.data.recipes,
            generatedFrom: res.data.generatedFrom,
            isFallback: res.data.isFallback,
          },
        });
        if (res.data.isFallback) {
          toast('Showing sample recipes. Check your connection and try again.', { icon: '⚠️' });
        }
        return { success: true, recipes: res.data.recipes };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate recipes';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false };
    }
  }, []);

  const saveRecipe = useCallback(async (recipe) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const res = await recipeService.saveRecipe(recipe);
      if (res.success) {
        dispatch({ type: 'ADD_SAVED_RECIPE', payload: res.data.recipe });
        toast.success('Recipe saved! 🎉');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save recipe';
      dispatch({ type: 'SET_SAVING', payload: false });
      toast.error(message);
      return { success: false };
    }
  }, []);

  const fetchSavedRecipes = useCallback(async (params = {}) => {
    dispatch({ type: 'SET_LOADING_SAVED', payload: true });
    try {
      const res = await recipeService.getSavedRecipes(params);
      if (res.success) {
        dispatch({ type: 'SET_SAVED_RECIPES', payload: { data: res.data, meta: res.meta } });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load saved recipes';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
    }
  }, []);

  const deleteRecipe = useCallback(async (id) => {
    try {
      await recipeService.deleteRecipe(id);
      dispatch({ type: 'REMOVE_SAVED_RECIPE', payload: id });
      toast.success('Recipe deleted');
      return { success: true };
    } catch (error) {
      toast.error('Failed to delete recipe');
      return { success: false };
    }
  }, []);

  const selectRecipe = useCallback((recipe) => {
    dispatch({ type: 'SELECT_RECIPE', payload: recipe });
  }, []);

  const clearGenerated = useCallback(() => {
    dispatch({ type: 'CLEAR_GENERATED' });
  }, []);

  return (
    <RecipeContext.Provider value={{
      ...state,
      generateRecipes,
      saveRecipe,
      fetchSavedRecipes,
      deleteRecipe,
      selectRecipe,
      clearGenerated,
    }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used within RecipeProvider');
  return context;
};
