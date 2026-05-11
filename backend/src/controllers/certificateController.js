const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * @desc    Get all certificates for the authenticated user
 * @route   GET /api/certificates
 * @access  Private
 */
const getMyCertificates = async (req, res) => {
    const userId = req.user.id;

    try {
        const [certificates] = await db.query(`
            SELECT 
                cert.*, 
                c.title as course_title, 
                c.thumbnail_url, 
                u.first_name, 
                u.last_name,
                u.total_session_time_seconds,
                (SELECT AVG(qa.score_percentage) 
                 FROM quiz_attempts qa 
                 WHERE qa.user_id = u.id 
                 AND qa.quiz_id IN (
                     SELECT id FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = cert.course_id)
                 )) as course_grade,
                (SELECT COUNT(*) 
                 FROM ai_chat_logs acl 
                 WHERE acl.user_id = u.id 
                 AND acl.lesson_id IN (SELECT id FROM lessons WHERE course_id = cert.course_id)) as ai_interactions
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            JOIN users u ON cert.user_id = u.id
            WHERE cert.user_id = ?
            ORDER BY cert.issue_date DESC
        `, [userId]);

        res.json(certificates);
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Server error fetching certificates' });
    }
};

/**
 * @desc    Issue a certificate for a course if completed
 * @route   POST /api/certificates/issue/:courseId
 * @access  Private
 */
const issueCertificate = async (req, res) => {
    const userId = req.user.id;
    const { courseId } = req.params;

    try {
        // 1. Check if course is 100% completed
        const [progress] = await db.query(`
            SELECT cp.completion_percentage
            FROM course_progress cp
            JOIN enrollments e ON cp.enrollment_id = e.id
            WHERE e.user_id = ? AND e.course_id = ?
        `, [userId, courseId]);

        if (progress.length === 0 || progress[0].completion_percentage < 100) {
            return res.status(400).json({ message: 'Course must be 100% completed to earn a certificate.' });
        }

        // 2. Check if certificate already exists
        const [existing] = await db.query('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?', [userId, courseId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Certificate already issued for this course.' });
        }

        // 3. Generate unique verification code (8 chars)
        const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        // 4. Create certificate
        const certId = uuidv4();
        await db.query(`
            INSERT INTO certificates (id, user_id, course_id, verification_code)
            VALUES (?, ?, ?, ?)
        `, [certId, userId, courseId, verificationCode]);

        res.status(201).json({ message: 'Certificate issued successfully!', id: certId });
    } catch (error) {
        console.error('Error issuing certificate:', error);
        res.status(500).json({ message: 'Server error issuing certificate' });
    }
};

/**
 * @desc    Verify a certificate by code
 * @route   GET /api/certificates/verify/:code
 * @access  Public
 */
const verifyCertificate = async (req, res) => {
    const { code } = req.params;

    try {
        const [cert] = await db.query(`
            SELECT cert.*, c.title as course_title, u.first_name, u.last_name
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            JOIN users u ON cert.user_id = u.id
            WHERE cert.verification_code = ?
        `, [code]);

        if (cert.length === 0) {
            return res.status(404).json({ message: 'Invalid verification code.' });
        }

        res.json({
            valid: true,
            studentName: `${cert[0].first_name} ${cert[0].last_name}`,
            courseName: cert[0].course_title,
            issueDate: cert[0].issue_date,
            aiEvaluation: cert[0].ai_evaluation
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ message: 'Server error verifying certificate' });
    }
};

module.exports = {
    getMyCertificates,
    issueCertificate,
    verifyCertificate
};
