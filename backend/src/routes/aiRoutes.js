const express = require('express');
const router = express.Router();
const { askAssistant, askGlobalAssistant, getConversations, getConversationMessages } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/ai/ask — Ask the AI Tutor (RAG with semantic search)
router.post('/ask', authMiddleware, askAssistant);

// POST /api/ai/ask-global — Ask the Global AI Tutor
router.post('/ask-global', authMiddleware, askGlobalAssistant);

// GET /api/ai/conversations — Get user's conversation history
router.get('/conversations', authMiddleware, getConversations);

// GET /api/ai/conversations/:id/messages — Get messages for a conversation
router.get('/conversations/:id/messages', authMiddleware, getConversationMessages);

module.exports = router;
