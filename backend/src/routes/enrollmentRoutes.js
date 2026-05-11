const express = require('express');
const router = express.Router();
const { enrollUser, getMyEnrollments } = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected: Enroll in a course
router.post('/', authMiddleware, enrollUser);

// Protected: Get my enrolled courses
router.get('/my-courses', authMiddleware, getMyEnrollments);

module.exports = router;
