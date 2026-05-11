const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * @desc    Enroll a user in a course
 * @route   POST /api/enrollments
 */
const enrollUser = async (req, res) => {
    const { course_id } = req.body;
    const user_id = req.user.id; // From authMiddleware

    try {
        // 1. Check if already enrolled
        const [existing] = await db.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [user_id, course_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'User is already enrolled in this course' });
        }

        // 2. Create enrollment
        const enrollmentId = uuidv4();
        await db.query(
            'INSERT INTO enrollments (id, user_id, course_id, status) VALUES (?, ?, ?, ?)',
            [enrollmentId, user_id, course_id, 'active']
        );

        // 3. Initialize Course Progress row
        const progressId = uuidv4();
        await db.query(
            'INSERT INTO course_progress (id, enrollment_id, completion_percentage) VALUES (?, ?, ?)',
            [progressId, enrollmentId, 0.00]
        );

        // 4. Log the activity
        await db.query(
            'INSERT INTO user_activity_logs (id, user_id, action_type, target_id) VALUES (?, ?, ?, ?)',
            [uuidv4(), user_id, 'ENROLLMENT', course_id]
        );

        res.status(201).json({
            message: 'Enrolled successfully!',
            enrollmentId
        });
    } catch (error) {
        console.error('Error enrolling user:', error);
        res.status(500).json({ message: 'Server error during enrollment' });
    }
};

/**
 * @desc    Get current user's enrolled courses
 * @route   GET /api/enrollments/my-courses
 */
const getMyEnrollments = async (req, res) => {
    const user_id = req.user.id;
    try {
        const [enrolled] = await db.query(`
            SELECT c.*, e.id as enrollment_id, e.enrolled_at, cp.completion_percentage,
                (SELECT GROUP_CONCAT(lp.lesson_id)
                 FROM lesson_progress lp
                 WHERE lp.enrollment_id = e.id AND lp.is_completed = 1) as completed_lesson_ids
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
            WHERE e.user_id = ?
        `, [user_id]);
        res.status(200).json(enrolled);
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({ message: 'Server error fetching enrollments' });
    }
};

module.exports = { enrollUser, getMyEnrollments };
