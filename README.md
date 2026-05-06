# 🍳 ChefAI — AI-Based Leftover Food Recipe Predictor

A production-ready full-stack MERN application that transforms leftover ingredients into gourmet recipes using AI (GitHub Models + GPT-4o-mini).

![ChefAI Landing](./docs/landing.png)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **GitHub Models Token** (for AI features)

### 1. Backend Setup

```bash
cd backend
npm install
# .env is already configured with your GitHub token
npm run dev
# → Server running at http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:5173
```# 🍳 ChefAI — AI-Based Leftover Food Recipe Predictor

A production-ready full-stack MERN application that transforms leftover ingredients into gourmet recipes using AI (GitHub Models + GPT-4o-mini).

![ChefAI Landing](./docs/landing.png)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **GitHub Models Token** (for AI features)

### 1. Backend Setup

```bash
cd backend
npm install
# .env is already configured with your GitHub token
npm run dev
# → Server running at http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/recipe-predictor  # ← or your Atlas URI
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
GITHUB_TOKEN=your_github_pat_token
OPENAI_BASE_URL=https://models.inference.ai.azure.com
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

```
ai-recipe-predictor/
├── backend/
│   ├── config/db.js              # MongoDB connection with retry
│   ├── controllers/
│   │   ├── authController.js     # Register, login, profile
│   │   ├── recipeController.js   # AI generation, save, delete
│   │   ├── chatController.js     # AI chat assistant
│   │   └── mealPlanController.js # Weekly meal planner
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── errorHandler.js       # Centralized error handling
│   │   ├── rateLimiter.js        # Rate limiting (general + AI)
│   │   └── upload.js             # Multer image upload
│   ├── models/
│   │   ├── User.js               # User schema + bcrypt + JWT
│   │   ├── Recipe.js             # AI recipe schema
│   │   ├── ChatMessage.js        # Chat history (30d TTL)
│   │   └── MealPlan.js           # Weekly meal plan
│   ├── routes/
│   │   ├── auth.js               # /api/auth
│   │   ├── recipes.js            # /api/recipes
│   │   ├── chat.js               # /api/chat
│   │   └── mealplan.js           # /api/mealplan
│   ├── services/
│   │   └── aiService.js          # GitHub Models AI integration
│   ├── utils/
│   │   ├── apiResponse.js        # Standardized responses
│   │   └── validators.js         # Joi validation schemas
│   └── server.js                 # Express entry point
│
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx    # Auth state + localStorage
        │   ├── RecipeContext.jsx  # Recipe generation + CRUD
        │   └── ChatContext.jsx    # Chat state management
        ├── pages/
        │   ├── Landing.jsx        # Public landing page
        │   ├── Auth.jsx           # Login / Register
        │   ├── Home.jsx           # Ingredient input + generate
        │   ├── Results.jsx        # AI-generated recipe grid
        │   ├── SavedRecipes.jsx   # Saved recipes + search/filter
        │   ├── Dashboard.jsx      # Profile + meal planner
        │   └── ChatAssistant.jsx  # AI cooking chat
        ├── components/
        │   ├── layout/Navbar.jsx  # Glassmorphism navbar
        │   ├── recipe/
        │   │   ├── RecipeCard.jsx       # Card with modal
        │   │   └── NutritionChart.jsx   # Chart.js doughnut + bar
        │   └── ui/
        │       ├── Modal.jsx      # Animated modal
        │       └── Spinner.jsx    # Loading spinner
        └── services/
            ├── api.js             # Axios + JWT interceptor
            └── index.js           # All service functions
```

---

## 🌐 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile (🔒) |
| PUT | `/api/auth/profile` | Update profile (🔒) |

### Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recipes/generate` | AI recipe generation (🔒) |
| POST | `/api/recipes/analyze-image` | Extract ingredients from image (🔒) |
| GET | `/api/recipes/saved` | Get saved recipes (🔒) |
| POST | `/api/recipes/save` | Save a recipe (🔒) |
| DELETE | `/api/recipes/:id` | Delete a recipe (🔒) |
| GET | `/api/recipes/substitutions?ingredient=X` | Smart substitutions (🔒) |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message to Chef AI (🔒) |
| GET | `/api/chat/history` | Get chat history (🔒) |
| DELETE | `/api/chat/history` | Clear chat history (🔒) |

### Meal Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mealplan` | Get weekly plan (🔒) |
| PUT | `/api/mealplan` | Update weekly plan (🔒) |
| DELETE | `/api/mealplan` | Clear weekly plan (🔒) |

🔒 = Requires `Authorization: Bearer <token>` header

---

## 🚢 Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import to Vercel
3. Set env var: `VITE_API_URL=https://your-backend.render.com/api`

### Backend → Render
1. Push `backend/` to GitHub
2. Create Web Service on Render
3. Set all env vars from `backend/.env`
4. Set `MONGODB_URI` to your Atlas URI
5. Build command: `npm install`
6. Start command: `npm start`

### MongoDB Atlas
1. Create free cluster at cloud.mongodb.com
2. Whitelist IP `0.0.0.0/0` for MVP
3. Get connection string → set as `MONGODB_URI`

---

## ✨ Features

- **🧠 AI Recipes** — 3-5 personalized recipes per search using GPT-4o-mini
- **📸 Image Recognition** — Upload a fridge photo, AI detects ingredients
- **🎙️ Voice Input** — Say your ingredients (Web Speech API)
- **🥗 Dietary Filters** — Vegetarian, vegan, keto, gluten-free + more
- **📊 Nutrition Charts** — Calories, macros, fiber per recipe
- **🤖 Chat Assistant** — Ask any cooking question
- **❤️ Save Recipes** — Personal cookbook with search & sort
- **📅 Meal Planner** — Weekly planning grid
- **🔒 JWT Auth** — Secure registration & login

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Animations | Framer Motion |
| Charts | Chart.js + react-chartjs-2 |
| HTTP | Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | GitHub Models (GPT-4o-mini) |
| Auth | JWT + bcrypt |
| Validation | Joi |
| Upload | Multer |



---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/recipe-predictor  # ← or your Atlas URI
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
GITHUB_TOKEN=your_github_pat_token
OPENAI_BASE_URL=https://models.inference.ai.azure.com
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

```
ai-recipe-predictor/
├── backend/
│   ├── config/db.js              # MongoDB connection with retry
│   ├── controllers/
│   │   ├── authController.js     # Register, login, profile
│   │   ├── recipeController.js   # AI generation, save, delete
│   │   ├── chatController.js     # AI chat assistant
│   │   └── mealPlanController.js # Weekly meal planner
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── errorHandler.js       # Centralized error handling
│   │   ├── rateLimiter.js        # Rate limiting (general + AI)
│   │   └── upload.js             # Multer image upload
│   ├── models/
│   │   ├── User.js               # User schema + bcrypt + JWT
│   │   ├── Recipe.js             # AI recipe schema
│   │   ├── ChatMessage.js        # Chat history (30d TTL)
│   │   └── MealPlan.js           # Weekly meal plan
│   ├── routes/
│   │   ├── auth.js               # /api/auth
│   │   ├── recipes.js            # /api/recipes
│   │   ├── chat.js               # /api/chat
│   │   └── mealplan.js           # /api/mealplan
│   ├── services/
│   │   └── aiService.js          # GitHub Models AI integration
│   ├── utils/
│   │   ├── apiResponse.js        # Standardized responses
│   │   └── validators.js         # Joi validation schemas
│   └── server.js                 # Express entry point
│
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx    # Auth state + localStorage
        │   ├── RecipeContext.jsx  # Recipe generation + CRUD
        │   └── ChatContext.jsx    # Chat state management
        ├── pages/
        │   ├── Landing.jsx        # Public landing page
        │   ├── Auth.jsx           # Login / Register
        │   ├── Home.jsx           # Ingredient input + generate
        │   ├── Results.jsx        # AI-generated recipe grid
        │   ├── SavedRecipes.jsx   # Saved recipes + search/filter
        │   ├── Dashboard.jsx      # Profile + meal planner
        │   └── ChatAssistant.jsx  # AI cooking chat
        ├── components/
        │   ├── layout/Navbar.jsx  # Glassmorphism navbar
        │   ├── recipe/
        │   │   ├── RecipeCard.jsx       # Card with modal
        │   │   └── NutritionChart.jsx   # Chart.js doughnut + bar
        │   └── ui/
        │       ├── Modal.jsx      # Animated modal
        │       └── Spinner.jsx    # Loading spinner
        └── services/
            ├── api.js             # Axios + JWT interceptor
            └── index.js           # All service functions
```

---

## 🌐 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile (🔒) |
| PUT | `/api/auth/profile` | Update profile (🔒) |

### Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recipes/generate` | AI recipe generation (🔒) |
| POST | `/api/recipes/analyze-image` | Extract ingredients from image (🔒) |
| GET | `/api/recipes/saved` | Get saved recipes (🔒) |
| POST | `/api/recipes/save` | Save a recipe (🔒) |
| DELETE | `/api/recipes/:id` | Delete a recipe (🔒) |
| GET | `/api/recipes/substitutions?ingredient=X` | Smart substitutions (🔒) |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message to Chef AI (🔒) |
| GET | `/api/chat/history` | Get chat history (🔒) |
| DELETE | `/api/chat/history` | Clear chat history (🔒) |

### Meal Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mealplan` | Get weekly plan (🔒) |
| PUT | `/api/mealplan` | Update weekly plan (🔒) |
| DELETE | `/api/mealplan` | Clear weekly plan (🔒) |

🔒 = Requires `Authorization: Bearer <token>` header

---

## 🚢 Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import to Vercel
3. Set env var: `VITE_API_URL=https://your-backend.render.com/api`

### Backend → Render
1. Push `backend/` to GitHub
2. Create Web Service on Render
3. Set all env vars from `backend/.env`
4. Set `MONGODB_URI` to your Atlas URI
5. Build command: `npm install`
6. Start command: `npm start`

### MongoDB Atlas
1. Create free cluster at cloud.mongodb.com
2. Whitelist IP `0.0.0.0/0` for MVP
3. Get connection string → set as `MONGODB_URI`

---

## ✨ Features

- **🧠 AI Recipes** — 3-5 personalized recipes per search using GPT-4o-mini
- **📸 Image Recognition** — Upload a fridge photo, AI detects ingredients
- **🎙️ Voice Input** — Say your ingredients (Web Speech API)
- **🥗 Dietary Filters** — Vegetarian, vegan, keto, gluten-free + more
- **📊 Nutrition Charts** — Calories, macros, fiber per recipe
- **🤖 Chat Assistant** — Ask any cooking question
- **❤️ Save Recipes** — Personal cookbook with search & sort
- **📅 Meal Planner** — Weekly planning grid
- **🔒 JWT Auth** — Secure registration & login

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Animations | Framer Motion |
| Charts | Chart.js + react-chartjs-2 |
| HTTP | Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | GitHub Models (GPT-4o-mini) |
| Auth | JWT + bcrypt |
| Validation | Joi |
| Upload | Multer |
