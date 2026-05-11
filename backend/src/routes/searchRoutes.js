const express = require('express');
const router = express.Router();
const { searchLessons, searchVideo } = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/search/lessons — Semantic search across lesson content
router.post('/lessons', authMiddleware, searchLessons);

// POST /api/search/video — Search video transcripts (returns timestamps)
router.post('/video', authMiddleware, searchVideo);

module.exports = router;
