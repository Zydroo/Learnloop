const db = require('../db');
const { generateJSON } = require('../services/aiService');

/**
 * @desc    Generate an AI-verified skill map for the user
 * @route   GET /api/skills/my-map
 * @access  Private
 */
const getMySkillMap = async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Gather comprehensive student performance data
        // Recent Quiz Attempts (Scores and Topics)
        const [quizzes] = await db.query(`
            SELECT l.title, qa.score_percentage
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            WHERE qa.user_id = ?
            ORDER BY qa.attempted_at DESC LIMIT 20
        `, [userId]);

        // Course Progress
        const [progress] = await db.query(`
            SELECT c.title, cp.completion_percentage
            FROM course_progress cp
            JOIN enrollments e ON cp.enrollment_id = e.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ?
        `, [userId]);

        // AI Chat interactions (to see what they are asking about)
        const [chatLogs] = await db.query(`
            SELECT user_query FROM ai_chat_logs WHERE user_id = ? LIMIT 10
        `, [userId]);

        // 2. Send to Gemini for Skill Mapping
        const prompt = `
            Analyze this student's learning profile and generate a "Professional Skill Map".
            
            COURSES & PROGRESS:
            ${progress.map(p => `- ${p.title}: ${p.completion_percentage}% complete`).join('\n')}

            QUIZ PERFORMANCE:
            ${quizzes.map(q => `- ${q.title}: ${q.score_percentage}%`).join('\n')}

            RECENT QUESTIONS ASKED:
            ${chatLogs.map(l => `- ${l.user_query}`).join('\n')}

            Based on this, identify 3-5 specific technical skills they have demonstrated.
            Rate each skill from 1 to 100 based on their quiz scores and progress.
            Also provide a short "Professional Summary" for their profile.

            Return ONLY valid JSON in this format:
            {
                "skills": [
                    { "name": "React Hooks", "level": 85, "category": "Frontend" },
                    ...
                ],
                "professional_summary": "A dedicated learner with a strong focus on frontend architecture and..."
            }
        `;

        const skillData = await generateJSON(prompt);
        res.json(skillData);

    } catch (error) {
        console.error('Skill Map Error:', error);
        res.status(500).json({ message: 'Failed to generate skill map' });
    }
};

module.exports = { getMySkillMap };
