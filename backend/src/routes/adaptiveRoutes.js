const express = require('express');
const router = express.Router();
const { getRecommendation } = require('../controllers/adaptiveController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/recommendation', authMiddleware, getRecommendation);

module.exports = router;
