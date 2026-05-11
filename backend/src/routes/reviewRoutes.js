const express = require('express');
const router = express.Router();
const { getCourseReviews, submitReview } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route to get reviews
router.get('/course/:courseId', getCourseReviews);

// Private route to submit a review
router.post('/course/:courseId', authMiddleware, submitReview);

module.exports = router;
