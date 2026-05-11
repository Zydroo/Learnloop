const express = require('express');
const router = express.Router();
const { ingestTranscript } = require('../controllers/aiController');
const { getStats, getStudents, getActivity, parsePlaylist, extractTranscript, getStudentDetails, updateCourseStatus } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Dashboard Stats
router.get('/stats', authMiddleware, getStats);

// Course Management
router.patch('/courses/:id/status', authMiddleware, updateCourseStatus);

// Student Management
router.get('/students', authMiddleware, getStudents);
router.get('/students/:id', authMiddleware, getStudentDetails);

// Recent Activity
router.get('/activity', authMiddleware, getActivity);

// Parse YouTube Playlist
router.post('/parse-playlist', authMiddleware, parsePlaylist);

// POST /api/admin/ingest -> Refine transcript and generate quiz
router.post('/ingest', authMiddleware, ingestTranscript);

// POST /api/admin/extract-transcript/:lessonId -> Auto fetch transcript from video
router.post('/extract-transcript/:lessonId', authMiddleware, extractTranscript);

module.exports = router;
