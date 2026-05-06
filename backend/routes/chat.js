const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, clearChatHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validators');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

// POST /api/chat/message
router.post('/message', aiLimiter, validate(schemas.chatMessageSchema), sendMessage);

// GET /api/chat/history
router.get('/history', getChatHistory);

// DELETE /api/chat/history
router.delete('/history', clearChatHistory);

module.exports = router;
