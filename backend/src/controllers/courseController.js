const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private (Instructor/Admin)
 */
const createCourse = async (req, res) => {
    const { title, description, price, thumbnail_url, lessons, is_private } = req.body;
    const instructor_id = req.user.id;

    try {
        const courseId = uuidv4();
        
        // 1. Create Course
        await db.query(
            'INSERT INTO courses (id, instructor_id, title, description, price, thumbnail_url, is_published, is_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [courseId, instructor_id, title, description, price || 0.00, thumbnail_url, 1, is_private ? 1 : 0]
        );

        // 2. Create Lessons if provided
        if (lessons && Array.isArray(lessons)) {
            for (let i = 0; i < lessons.length; i++) {
                const lessonId = uuidv4();
                await db.query(
                    'INSERT INTO lessons (id, course_id, title, video_url, sequence_order) VALUES (?, ?, ?, ?, ?)',
                    [lessonId, courseId, lessons[i].title, lessons[i].url, i + 1]
                );
            }
        }

        res.status(201).json({
            message: 'Course created successfully!',
            course: { id: courseId, title, description, price, lessonsCount: lessons?.length || 0 }
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Server error while creating course' });
    }
};

/**
 * @desc    Get all published/available courses
 * @route   GET /api/courses
 * @access  Public
 */
const getAllCourses = async (req, res) => {
    try {
        const userId = req.user?.id || null;
        const [courses] = await db.query(
            'SELECT * FROM courses WHERE is_private = 0 OR instructor_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error while fetching courses' });
    }
};

/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin)
 */
const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, thumbnail_url } = req.body;

    try {
        await db.query(
            'UPDATE courses SET title = ?, description = ?, price = ?, thumbnail_url = ? WHERE id = ?',
            [title, description, price, thumbnail_url, id]
        );
        res.status(200).json({ message: 'Course updated successfully' });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Server error while updating course' });
    }
};

/**
 * @desc    Delete a course
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin)
 */
const deleteCourse = async (req, res) => {
    const { id } = req.params;

    try {
        const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
        
        if (course.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await db.query('DELETE FROM courses WHERE id = ?', [id]);

        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Server error while deleting course' });
    }
};

/**
 * @desc    Get a single course by ID
 * @route   GET /api/courses/:id
 * @access  Public
 */
const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get Course with Enrollment Count and Avg Rating
        const userId = req.user?.id || null;
        const query = `
            SELECT c.*, 
                (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count,
                (SELECT AVG(score) FROM ratings WHERE course_id = c.id) as avg_rating
            FROM courses c 
            WHERE c.id = ? AND (c.is_private = 0 OR c.instructor_id = ?)
        `;
        const [courses] = await db.query(query, [id, userId]);
        
        if (courses.length === 0) return res.status(404).json({ message: 'Course not found or access denied' });
        
        // 2. Get Lessons
        const [lessons] = await db.query('SELECT * FROM lessons WHERE course_id = ? ORDER BY sequence_order ASC', [id]);
        
        res.status(200).json({ ...courses[0], lessons });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ message: 'Server error while fetching course' });
    }
};

/**
 * @desc    Search courses (Hybrid: SQL LIKE + Semantic Fallback)
 * @route   GET /api/courses/search?q=...
 */
const searchCourses = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Query is required' });

    try {
        const userId = req.user?.id || null;
        // 1. Keyword Search
        const [results] = await db.query(
            'SELECT * FROM courses WHERE (title LIKE ? OR description LIKE ?) AND (is_private = 0 OR instructor_id = ?)',
            [`%${q}%`, `%${q}%`, userId]
        );

        if (results.length > 0) {
            return res.status(200).json(results);
        }

        // 2. Semantic Fallback (if no keywords match)
        // Here we could use semanticSearch from embeddingService but limited to course level
        // For now, let's just return empty if SQL fails, but keep it extensible
        res.status(200).json([]);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
};

module.exports = { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, searchCourses };
