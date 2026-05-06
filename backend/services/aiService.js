const OpenAI = require('openai');
const fs = require('fs');

// ─── OpenAI Client (GitHub Models) ───────────────────────────────────────────
const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// ─── Fallback Recipe Data ─────────────────────────────────────────────────────
const FALLBACK_RECIPES = [
  {
    title: 'Simple Vegetable Stir-Fry',
    description: 'A quick and healthy stir-fry using common vegetables. Perfect for using up leftover produce.',
    ingredients: [
      { name: 'Mixed vegetables', amount: '2', unit: 'cups' },
      { name: 'Soy sauce', amount: '2', unit: 'tbsp' },
      { name: 'Garlic', amount: '3', unit: 'cloves' },
      { name: 'Olive oil', amount: '2', unit: 'tbsp' },
    ],
    instructions: [
      { step: 1, description: 'Heat oil in a wok or large pan over high heat.', duration: '1 minute' },
      { step: 2, description: 'Add garlic and cook until fragrant.', duration: '30 seconds' },
      { step: 3, description: 'Add vegetables and stir-fry until tender-crisp.', duration: '5 minutes' },
      { step: 4, description: 'Add soy sauce and toss to coat. Serve hot.', duration: '1 minute' },
    ],
    cookingTime: { prep: 10, cook: 8, total: 18 },
    servings: 2,
    difficulty: 'easy',
    cuisine: 'Asian',
    tags: ['vegetarian', 'vegan', 'quick', 'healthy'],
    nutrition: { calories: 180, protein: 5, carbohydrates: 22, fat: 8, fiber: 4, sugar: 8, sodium: 650 },
    substitutions: [
      { original: 'Soy sauce', alternatives: ['Tamari (gluten-free)', 'Coconut aminos'], note: 'Use tamari for a gluten-free option' },
    ],
  },
];

// ─── Helper: Parse AI JSON Response ──────────────────────────────────────────
const parseAIResponse = (content) => {
  try {
    // Try direct JSON parse
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue to next strategy
      }
    }

    // Try to find JSON object/array in the text
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Fall through
      }
    }

    throw new Error('Could not parse AI response as JSON');
  }
};

// ─── Helper: Validate and Normalize Recipe ────────────────────────────────────
const normalizeRecipe = (recipe) => ({
  title: recipe.title || 'Unnamed Recipe',
  description: recipe.description || '',
  ingredients: (recipe.ingredients || []).map((ing) =>
    typeof ing === 'string'
      ? { name: ing, amount: '', unit: '' }
      : { name: ing.name || ing.ingredient || '', amount: String(ing.amount || ''), unit: ing.unit || '' }
  ),
  instructions: (recipe.instructions || recipe.steps || []).map((inst, idx) =>
    typeof inst === 'string'
      ? { step: idx + 1, description: inst, duration: '', tip: '' }
      : { step: inst.step || idx + 1, description: inst.description || inst.text || '', duration: inst.duration || inst.time || '', tip: inst.tip || '' }
  ),
  cookingTime: {
    prep: parseInt(recipe.cookingTime?.prep || recipe.prepTime || 0),
    cook: parseInt(recipe.cookingTime?.cook || recipe.cookTime || 0),
    total: parseInt(recipe.cookingTime?.total || recipe.totalTime || 0),
  },
  servings: parseInt(recipe.servings || 2),
  difficulty: ['easy', 'medium', 'hard'].includes(recipe.difficulty) ? recipe.difficulty : 'medium',
  cuisine: recipe.cuisine || 'International',
  tags: Array.isArray(recipe.tags) ? recipe.tags : [],
  nutrition: {
    calories: parseInt(recipe.nutrition?.calories || 0),
    protein: parseFloat(recipe.nutrition?.protein || 0),
    carbohydrates: parseFloat(recipe.nutrition?.carbohydrates || recipe.nutrition?.carbs || 0),
    fat: parseFloat(recipe.nutrition?.fat || 0),
    fiber: parseFloat(recipe.nutrition?.fiber || 0),
    sugar: parseFloat(recipe.nutrition?.sugar || 0),
    sodium: parseFloat(recipe.nutrition?.sodium || 0),
  },
  substitutions: (recipe.substitutions || []).map((sub) =>
    typeof sub === 'string'
      ? { original: sub, alternatives: [], note: '' }
      : { original: sub.original || sub.ingredient || '', alternatives: sub.alternatives || sub.substitutes || [], note: sub.note || '' }
  ),
});

// ─── 1. Generate Recipes from Ingredients ────────────────────────────────────
const generateRecipes = async (ingredients, filters = {}, count = 3) => {
  const { dietary = [], maxCookingTime = 60, maxCalories = null, difficulty = 'any', servings = 2, cuisine = '' } = filters;

  const dietaryStr = dietary.length > 0 ? `Dietary restrictions: ${dietary.join(', ')}.` : '';
  const calorieStr = maxCalories ? `Maximum ${maxCalories} calories per serving.` : '';
  const cuisineStr = cuisine ? `Preferred cuisine: ${cuisine}.` : '';

  const systemPrompt = `You are a professional chef and nutritionist with 20 years of experience. 
Your task is to generate creative, practical recipes based on available ingredients.
You MUST respond ONLY with valid JSON — no markdown, no explanations, no extra text.
Always include realistic nutritional information and smart ingredient substitutions.`;

  const userPrompt = `I have these leftover ingredients: ${ingredients.join(', ')}.

Please generate exactly ${count} different recipes I can make.
Constraints:
- Maximum cooking time: ${maxCookingTime} minutes
- Servings: ${servings}
- Difficulty: ${difficulty === 'any' ? 'any level' : difficulty}
${dietaryStr}
${calorieStr}
${cuisineStr}

Respond ONLY with this exact JSON structure:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Brief, appetizing description (2-3 sentences)",
      "ingredients": [
        { "name": "ingredient name", "amount": "quantity", "unit": "unit of measurement" }
      ],
      "instructions": [
        { "step": 1, "description": "Detailed instruction", "duration": "X minutes", "tip": "Optional helpful tip" }
      ],
      "cookingTime": { "prep": 10, "cook": 20, "total": 30 },
      "servings": 2,
      "difficulty": "easy|medium|hard",
      "cuisine": "Cuisine type",
      "tags": ["tag1", "tag2"],
      "nutrition": {
        "calories": 350,
        "protein": 25,
        "carbohydrates": 40,
        "fat": 12,
        "fiber": 5,
        "sugar": 8,
        "sodium": 450
      },
      "substitutions": [
        { "original": "ingredient", "alternatives": ["alt1", "alt2"], "note": "When to use these" }
      ]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const parsed = parseAIResponse(content);

    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error('Invalid response structure from AI');
    }

    return {
      recipes: parsed.recipes.map(normalizeRecipe),
      model: MODEL,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('AI recipe generation error:', error.message);

    // Return fallback recipes with a flag
    return {
      recipes: FALLBACK_RECIPES.map(normalizeRecipe),
      model: 'fallback',
      isFallback: true,
      error: error.message,
    };
  }
};

// ─── 2. Analyze Image for Ingredients (Vision) ────────────────────────────────
const analyzeImage = async (imagePath) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = imagePath.split('.').pop().toLowerCase();
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'image/webp';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Vision requires gpt-4o
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look at this image and identify all food ingredients you can see.
Respond ONLY with this JSON:
{
  "ingredients": ["ingredient1", "ingredient2"],
  "confidence": "high|medium|low",
  "notes": "Any relevant observations about the ingredients"
}`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    return parseAIResponse(content);
  } catch (error) {
    console.error('Image analysis error:', error.message);

    // Graceful fallback - prompt user to type ingredients
    return {
      ingredients: [],
      confidence: 'failed',
      notes: 'Could not analyze image automatically. Please type your ingredients.',
      error: error.message,
    };
  }
};

// ─── 3. AI Chat Assistant ─────────────────────────────────────────────────────
const chatWithAssistant = async (history, userMessage) => {
  const systemPrompt = `You are Chef AI, a friendly and knowledgeable culinary assistant. 
You help users with:
- Cooking techniques and tips
- Recipe modifications and substitutions  
- Food safety advice
- Nutritional information
- Meal planning suggestions

Be conversational, encouraging, and practical. Keep responses concise (2-4 sentences unless a detailed explanation is needed).
If asked about non-food topics, politely redirect to cooking-related questions.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((msg) => ({ role: msg.role, content: msg.content })), // Last 10 messages for context
    { role: 'user', content: userMessage },
  ];

  try {
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 600,
    });

    return {
      content: response.choices[0].message.content,
      model: MODEL,
      tokensUsed: response.usage?.total_tokens || 0,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Chat assistant error:', error.message);
    return {
      content: "I'm having trouble connecting right now. Please try again in a moment! In the meantime, feel free to explore the recipe suggestions or check your saved recipes.",
      model: 'fallback',
      error: error.message,
    };
  }
};

// ─── 4. Get Smart Substitutions ───────────────────────────────────────────────
const getSubstitutions = async (ingredient, context = '') => {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a culinary expert. Respond ONLY with valid JSON.',
        },
        {
          role: 'user',
          content: `Provide smart substitutions for "${ingredient}"${context ? ` in the context of: ${context}` : ''}.
          
Respond with this exact JSON:
{
  "ingredient": "${ingredient}",
  "substitutions": [
    {
      "name": "Substitute name",
      "ratio": "1:1 or 2:1 etc.",
      "notes": "How it affects the dish and when to use it",
      "dietaryBenefit": "e.g., vegan, lower-calorie, etc."
    }
  ],
  "generalTip": "Overall cooking tip for this substitution"
}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    return parseAIResponse(response.choices[0].message.content);
  } catch (error) {
    console.error('Substitutions error:', error.message);
    return {
      ingredient,
      substitutions: [],
      generalTip: 'Unable to fetch substitutions. Please try again.',
      error: error.message,
    };
  }
};

module.exports = {
  generateRecipes,
  analyzeImage,
  chatWithAssistant,
  getSubstitutions,
};
