const express = require('express');
const router = express.Router();
const { updateSession, logEvent, updateWatchTime, getUserActivity, getDetailedProgress, getAdvancedAnalytics, completeLesson, getStudentRisk } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/session', authMiddleware, updateSession);
router.post('/event', authMiddleware, logEvent);
router.post('/watch-time', authMiddleware, updateWatchTime);
router.get('/my-activity', authMiddleware, getUserActivity);
router.get('/progress', authMiddleware, getDetailedProgress);
router.get('/advanced', authMiddleware, getAdvancedAnalytics);
router.post('/complete-lesson', authMiddleware, completeLesson);
router.get('/student-risk/:userId', authMiddleware, getStudentRisk);

module.exports = router;
