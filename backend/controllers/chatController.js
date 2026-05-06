const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── POST /api/chat/message ───────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    // Fetch recent chat history for context
    const history = await ChatMessage.find({
      userId: req.user._id,
      sessionId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Reverse to get chronological order
    const orderedHistory = history.reverse();

    // Save user message
    await ChatMessage.create({
      userId: req.user._id,
      role: 'user',
      content: message,
      sessionId,
    });

    // Get AI response
    const aiResult = await aiService.chatWithAssistant(orderedHistory, message);

    // Save AI response
    const assistantMessage = await ChatMessage.create({
      userId: req.user._id,
      role: 'assistant',
      content: aiResult.content,
      sessionId,
      metadata: {
        model: aiResult.model,
        tokensUsed: aiResult.tokensUsed,
        responseTime: aiResult.responseTime,
      },
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.chatMessages': 1 } });

    return sendSuccess(res, 200, 'Message sent', {
      message: {
        id: assistantMessage._id,
        role: 'assistant',
        content: aiResult.content,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/chat/history ────────────────────────────────────────────────────
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId = 'default', limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      userId: req.user._id,
      sessionId,
    })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .select('role content createdAt sessionId');

    return sendSuccess(res, 200, 'Chat history fetched', { messages });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/chat/history ─────────────────────────────────────────────────
const clearChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;

    const query = { userId: req.user._id };
    if (sessionId) query.sessionId = sessionId;

    await ChatMessage.deleteMany(query);

    return sendSuccess(res, 200, 'Chat history cleared.');
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getChatHistory, clearChatHistory };
