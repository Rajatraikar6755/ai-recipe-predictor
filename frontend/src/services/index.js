import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

export const recipeService = {
  generateRecipes: async (data) => {
    const response = await api.post('/recipes/generate', data);
    return response.data;
  },

  analyzeImage: async (formData) => {
    const response = await api.post('/recipes/analyze-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  saveRecipe: async (recipeData) => {
    const response = await api.post('/recipes/save', recipeData);
    return response.data;
  },

  getSavedRecipes: async (params = {}) => {
    const response = await api.get('/recipes/saved', { params });
    return response.data;
  },

  getRecipeById: async (id) => {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },

  deleteRecipe: async (id) => {
    const response = await api.delete(`/recipes/${id}`);
    return response.data;
  },

  getSubstitutions: async (ingredient, context = '') => {
    const response = await api.get('/recipes/substitutions', { params: { ingredient, context } });
    return response.data;
  },
};

export const chatService = {
  sendMessage: async (message, sessionId = 'default') => {
    const response = await api.post('/chat/message', { message, sessionId });
    return response.data;
  },

  getHistory: async (sessionId = 'default', limit = 50) => {
    const response = await api.get('/chat/history', { params: { sessionId, limit } });
    return response.data;
  },

  clearHistory: async (sessionId) => {
    const response = await api.delete('/chat/history', { params: sessionId ? { sessionId } : {} });
    return response.data;
  },
};

export const mealPlanService = {
  getMealPlan: async (weekStart) => {
    const response = await api.get('/mealplan', { params: weekStart ? { weekStart } : {} });
    return response.data;
  },

  updateMealPlan: async (data) => {
    const response = await api.put('/mealplan', data);
    return response.data;
  },

  clearMealPlan: async (weekStart) => {
    const response = await api.delete('/mealplan', { params: { weekStart } });
    return response.data;
  },
};
