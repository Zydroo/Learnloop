const db = require('../db');
const { generateJSON } = require('../services/aiService');

/**
 * @desc    Generate a personalized recommendation for the student
 * @route   GET /api/adaptive/recommendation
 * @access  Private
 */
const getRecommendation = async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Gather student data
        // Fetch recent quiz attempts
        const [quizAttempts] = await db.query(`
            SELECT q.lesson_id, l.title as lesson_title, qa.score_percentage, qa.attempted_at
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            WHERE qa.user_id = ?
            ORDER BY qa.attempted_at DESC LIMIT 5
        `, [userId]);

        // Fetch recent video watching data (attention)
        const [watchProgress] = await db.query(`
            SELECT l.title as lesson_title, lp.watch_time_seconds, lp.is_completed
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            JOIN enrollments e ON lp.enrollment_id = e.id
            WHERE e.user_id = ?
            ORDER BY lp.watch_time_seconds DESC LIMIT 5
        `, [userId]);

        // Format data for Gemini
        const studentProfile = `
        RECENT QUIZZES:
        ${quizAttempts.map(q => `- Lesson: "${q.lesson_title}", Score: ${q.score_percentage}%`).join('\n') || 'No quizzes taken yet.'}

        RECENT VIDEO WATCHING:
        ${watchProgress.map(w => `- Lesson: "${w.lesson_title}", Watch time: ${w.watch_time_seconds}s, Completed: ${w.is_completed}`).join('\n') || 'No videos watched yet.'}
        `;

        const prompt = `
        You are an advanced Adaptive AI Learning Engine for an online educational platform.
        Analyze the student's recent activity and performance data.
        
        STUDENT DATA:
        ${studentProfile}

        Based on this data, provide a single, highly personalized and encouraging recommendation for what the student should do next.
        For example:
        - If they scored low (< 70%) on a quiz, suggest they rewatch that specific lesson.
        - If they scored high, praise them and suggest moving to the next topic.
        - If they haven't done much, encourage them to start watching their first video.
        - Notice patterns in their watch time (e.g., stopping early).

        Return ONLY a JSON object in this exact format:
        {
            "recommendation_text": "Your personalized message here",
            "action_type": "review" | "continue" | "start",
            "target_lesson_title": "The name of the lesson (if applicable, else null)"
        }
        `;

        const suggestion = await generateJSON(prompt);

        res.json(suggestion);

    } catch (error) {
        console.error('Adaptive Engine Error:', error);
        res.status(500).json({ message: 'Failed to generate recommendation' });
    }
};

module.exports = {
    getRecommendation
};
