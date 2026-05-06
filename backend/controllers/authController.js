const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email already exists.');
    }

    // Create user (password hashing handled by pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate JWT
    const token = user.generateAuthToken();

    return sendSuccess(res, 201, 'Account created successfully!', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        dietaryPreferences: user.dietaryPreferences,
        cookingSkillLevel: user.cookingSkillLevel,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password (select: false by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Your account has been deactivated. Please contact support.');
    }

    const token = user.generateAuthToken();

    return sendSuccess(res, 200, 'Welcome back!', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        dietaryPreferences: user.dietaryPreferences,
        allergies: user.allergies,
        cookingSkillLevel: user.cookingSkillLevel,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/profile ────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedRecipes',
        select: 'title cookingTime difficulty tags nutrition createdAt',
        options: { limit: 5, sort: { createdAt: -1 } },
      });

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    return sendSuccess(res, 200, 'Profile fetched successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      dietaryPreferences: user.dietaryPreferences,
      allergies: user.allergies,
      cookingSkillLevel: user.cookingSkillLevel,
      stats: user.stats,
      savedRecipes: user.savedRecipes,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, dietaryPreferences, allergies, cookingSkillLevel, avatar } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (dietaryPreferences !== undefined) updateData.dietaryPreferences = dietaryPreferences;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (cookingSkillLevel !== undefined) updateData.cookingSkillLevel = cookingSkillLevel;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, 200, 'Profile updated successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      dietaryPreferences: user.dietaryPreferences,
      allergies: user.allergies,
      cookingSkillLevel: user.cookingSkillLevel,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile };
