const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * @desc    Get all reviews for a specific course
 * @route   GET /api/reviews/course/:courseId
 * @access  Public
 */
const getCourseReviews = async (req, res) => {
    const { courseId } = req.params;

    try {
        const [reviews] = await db.query(`
            SELECT r.id, r.content, r.created_at, u.first_name, u.last_name, ra.score
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN ratings ra ON (ra.course_id = r.course_id AND ra.user_id = r.user_id)
            WHERE r.course_id = ?
            ORDER BY r.created_at DESC
        `, [courseId]);

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};

/**
 * @desc    Submit a review and rating for a course
 * @route   POST /api/reviews/course/:courseId
 * @access  Private
 */
const submitReview = async (req, res) => {
    const { courseId } = req.params;
    const { content, score } = req.body;
    const userId = req.user.id;

    if (!content || !score) {
        return res.status(400).json({ message: 'Review content and rating are required' });
    }

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insert or Update Rating
            await connection.query(`
                INSERT INTO ratings (id, course_id, user_id, score)
                VALUES (UUID(), ?, ?, ?)
                ON DUPLICATE KEY UPDATE score = ?
            `, [courseId, userId, score, score]);

            // 2. Insert Review
            const reviewId = uuidv4();
            await connection.query(`
                INSERT INTO reviews (id, course_id, user_id, content)
                VALUES (?, ?, ?, ?)
            `, [reviewId, courseId, userId, content]);

            await connection.commit();
            res.status(201).json({ message: 'Review submitted successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error submitting review' });
    }
};

module.exports = {
    getCourseReviews,
    submitReview
};
