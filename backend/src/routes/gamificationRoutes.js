const express = require('express');
const router = express.Router();
const { getLeaderboard, getMyBadges, getUserRank } = require('../controllers/gamificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/leaderboard', authMiddleware, getLeaderboard);
router.get('/my-badges', authMiddleware, getMyBadges);
router.get('/my-rank', authMiddleware, getUserRank);

module.exports = router;
