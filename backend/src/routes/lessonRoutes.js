const express = require('express');
const router = express.Router();
const { addLesson, getCourseLessons, deleteLesson } = require('../controllers/lessonController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: View lessons for a course
router.get('/:courseId', getCourseLessons);

// Protected: Add/Delete a lesson
router.post('/', authMiddleware, addLesson);
router.delete('/:id', authMiddleware, deleteLesson);

module.exports = router;
