const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', authLimiter, validate(schemas.registerSchema), register);

// POST /api/auth/login
router.post('/login', authLimiter, validate(schemas.loginSchema), login);

// GET /api/auth/profile (protected)
router.get('/profile', protect, getProfile);

// PUT /api/auth/profile (protected)
router.put('/profile', protect, validate(schemas.updateProfileSchema), updateProfile);

module.exports = router;
