const express = require('express');
const router = express.Router();
const { processOnboarding, getStudentRecommendations } = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected: Onboarding Survey
router.post('/onboarding', authMiddleware, processOnboarding);

// Protected: Get recommendations
router.get('/', authMiddleware, getStudentRecommendations);

module.exports = router;
