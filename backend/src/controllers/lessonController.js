const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * @desc    Add a lesson to a course
 * @route   POST /api/lessons
 */
const addLesson = async (req, res) => {
    const { course_id, title, content_text, video_url, sequence_order } = req.body;

    try {
        const lessonId = uuidv4();
        await db.query(
            'INSERT INTO lessons (id, course_id, title, content_text, video_url, sequence_order) VALUES (?, ?, ?, ?, ?, ?)',
            [lessonId, course_id, title, content_text, video_url, sequence_order || 0]
        );

        res.status(201).json({
            message: 'Lesson added successfully!',
            lesson: { id: lessonId, title, sequence_order }
        });
    } catch (error) {
        console.error('Error adding lesson:', error);
        res.status(500).json({ message: 'Server error while adding lesson' });
    }
};

/**
 * @desc    Get all lessons for a specific course
 * @route   GET /api/lessons/:courseId
 */
const getCourseLessons = async (req, res) => {
    const { courseId } = req.params;

    try {
        const [lessons] = await db.query(
            'SELECT * FROM lessons WHERE course_id = ? ORDER BY sequence_order ASC',
            [courseId]
        );
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ message: 'Server error while fetching lessons' });
    }
};

/**
 * @desc    Delete a specific lesson
 * @route   DELETE /api/lessons/:id
 */
const deleteLesson = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM lessons WHERE id = ?', [id]);
        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({ message: 'Server error while deleting lesson' });
    }
};

module.exports = { addLesson, getCourseLessons, deleteLesson };
