const db = require('../db');
const aiService = require('../services/aiService');

/**
 * @desc    Process onboarding survey and generate AI recommendations
 * @route   POST /api/recommendations/onboarding
 * @access  Private
 */
const processOnboarding = async (req, res) => {
    const { goals, interests, level } = req.body;
    const userId = req.user.id;

    if (!goals || !interests) {
        return res.status(400).json({ message: 'Goals and interests are required' });
    }

    try {
        // 1. Fetch available courses
        const [courses] = await db.query('SELECT id, title, description FROM courses WHERE is_published = 1');
        
        if (courses.length === 0) {
            return res.status(200).json({ 
                recommendations: [], 
                message: 'No courses available for recommendation yet.' 
            });
        }

        // 2. Prepare AI Prompt
        const courseContext = courses.map(c => `ID: ${c.id} | Title: ${c.title} | Desc: ${c.description}`).join('\n');
        
        const prompt = `
            You are an expert academic advisor for LearnLoop, an AI-powered learning platform.
            A new student has joined with the following profile:
            - Goals: ${goals}
            - Interests: ${interests.join(', ')}
            - Experience Level: ${level}

            Here are our available courses:
            ${courseContext}

            Based on the student's profile, recommend the TOP 3 most relevant courses.
            Return the result in EXACTLY this JSON format:
            {
                "recommendations": [
                    {
                        "courseId": "uuid",
                        "matchScore": 0-100,
                        "reason": "Short personalized explanation why this fits them"
                    }
                ],
                "studentPersona": "A short 1-sentence description of the student's learning style based on their answers"
            }
        `;

        // 3. Get AI Recommendations
        const aiResponse = await aiService.generateJSON(prompt);
        
        // 4. Store recommendations in DB
        if (aiResponse && aiResponse.recommendations) {
            // Delete old recommendations if any
            await db.query('DELETE FROM recommendations WHERE user_id = ?', [userId]);

            // Insert new ones
            for (const rec of aiResponse.recommendations) {
                await db.query(
                    'INSERT INTO recommendations (id, user_id, course_id, reason, match_score) VALUES (UUID(), ?, ?, ?, ?)',
                    [userId, rec.courseId, rec.reason, rec.matchScore]
                );
            }
            
            // Update user profile with interests/goals (assuming columns exist or using a meta field)
            // For now, let's just return the data
            res.status(200).json({
                ...aiResponse,
                message: 'Recommendations generated successfully!'
            });
        } else {
            throw new Error('AI failed to generate valid recommendations');
        }

    } catch (error) {
        console.error('Onboarding Error:', error);
        res.status(500).json({ message: 'Failed to process onboarding' });
    }
};

/**
 * @desc    Get current student recommendations
 * @route   GET /api/recommendations
 * @access  Private
 */
const getStudentRecommendations = async (req, res) => {
    const userId = req.user.id;

    try {
        const [recs] = await db.query(`
            SELECT r.*, c.title, c.thumbnail_url, c.description, c.price
            FROM recommendations r
            JOIN courses c ON r.course_id = c.id
            WHERE r.user_id = ?
            ORDER BY r.match_score DESC
        `, [userId]);

        res.status(200).json(recs);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Server error fetching recommendations' });
    }
};

module.exports = {
    processOnboarding,
    getStudentRecommendations
};
