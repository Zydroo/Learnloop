const express = require('express');
const router = express.Router();
const { getLessonComments, postComment, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all comments for a lesson
router.get('/lesson/:lessonId', getLessonComments);

// Post a comment to a lesson
router.post('/lesson/:lessonId', authMiddleware, postComment);

// Delete a comment
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;
