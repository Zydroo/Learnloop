const express = require('express');
const router = express.Router();
const { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, searchCourses } = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');

// Public route: View all courses
router.get('/', optionalAuthMiddleware, getAllCourses);
router.get('/search', optionalAuthMiddleware, searchCourses);
router.get('/:id', optionalAuthMiddleware, getCourseById);

// Protected routes: Create, Update & Delete
router.post('/', authMiddleware, createCourse);
router.put('/:id', authMiddleware, updateCourse);
router.delete('/:id', authMiddleware, deleteCourse);

module.exports = router;
