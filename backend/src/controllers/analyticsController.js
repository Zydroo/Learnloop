const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const gamification = require('../services/gamificationService');
const { generateText } = require('../services/aiService');

/**
 * @desc    Start or update a study session
 * @route   POST /api/analytics/session
 * @access  Private
 */
const updateSession = async (req, res) => {
    const { session_id, action } = req.body;
    const user_id = req.user.id;

    try {
        if (action === 'start') {
            // Update daily streak and award login XP if new day
            await gamification.updateStreak(user_id);

            const newSessionId = uuidv4();
            await db.query(
                'INSERT INTO study_sessions (id, user_id) VALUES (?, ?)',
                [newSessionId, user_id]
            );
            return res.status(200).json({ session_id: newSessionId });
        } 
        
        if (action === 'heartbeat' || action === 'end') {
            if (!session_id) return res.status(400).json({ message: 'session_id required' });

            // Calculate duration
            const [sessions] = await db.query('SELECT start_time FROM study_sessions WHERE id = ?', [session_id]);
            if (sessions.length > 0) {
                const startTime = new Date(sessions[0].start_time);
                const durationSeconds = Math.floor((new Date() - startTime) / 1000);
                
                await db.query(
                    'UPDATE study_sessions SET duration_seconds = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?',
                    [durationSeconds, session_id]
                );

                // Update user total session time and award small XP for studying
                await db.query(
                    'UPDATE users SET total_session_time_seconds = total_session_time_seconds + ? WHERE id = ?',
                    [10, user_id] 
                );
                await gamification.awardXP(user_id, 1); // 1 XP per heartbeat (10s)
            }
            return res.status(200).json({ message: 'Session updated' });

        }
    } catch (error) {
        console.error('Session update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Log a behavioral event (tab switch, video skip, etc.)
 * @route   POST /api/analytics/event
 * @access  Private
 */
const logEvent = async (req, res) => {
    const { action_type, target_id, metadata } = req.body;
    const user_id = req.user.id;
    const ip_address = req.ip || req.connection.remoteAddress;

    console.log(`[LOG] Logging event for user ${user_id}: ${action_type}`);

    try {
        const logId = uuidv4();
        await db.query(
            'INSERT INTO user_activity_logs (id, user_id, action_type, target_id, metadata, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [logId, user_id, action_type, target_id, metadata ? JSON.stringify(metadata) : null, ip_address]
        );

        // AWARD XP BASED ON ACTION
        if (action_type === 'VIEW_LESSON') {
            await gamification.awardXP(user_id, gamification.XP_ACTIONS.WATCH_LESSON);
            await gamification.updateStreak(user_id);
        } else if (action_type === 'TAB_SWITCH_AWAY') {
            // Distraction penalty (-5 XP)
            await db.query(
                'UPDATE users SET xp = GREATEST(0, xp - 5) WHERE id = ?',
                [user_id]
            );
            console.log(`[PENALTY] User ${user_id} switched tabs. -5 XP.`);
        }

        res.status(200).json({ message: 'Event logged successfully' });
    } catch (error) {
        console.error('Event log error:', error);
        res.status(500).json({ message: 'Server error logging event' });
    }
};

/**
 * @desc    Update video watch time
 * @route   POST /api/analytics/watch-time
 * @access  Private
 */
const updateWatchTime = async (req, res) => {
    const { enrollment_id, lesson_id, elapsed_seconds } = req.body;

    try {
        await db.query(
            `INSERT INTO lesson_progress (id, enrollment_id, lesson_id, watch_time_seconds) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             watch_time_seconds = GREATEST(watch_time_seconds, ?)`,
            [uuidv4(), enrollment_id, lesson_id, elapsed_seconds, elapsed_seconds]
        );
        res.status(200).json({ message: 'Watch time updated' });
    } catch (error) {
        console.error('Watch time error:', error);
        res.status(500).json({ message: 'Server error updating watch time' });
    }
};

/**
 * @desc    Get recent activity for the current user
 * @route   GET /api/analytics/my-activity
 * @access  Private
 */
const getUserActivity = async (req, res) => {
    const user_id = req.user.id;
    try {
        const [logs] = await db.query(
            'SELECT action_type, created_at FROM user_activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [user_id]
        );
        console.log(`[GET] Fetched ${logs.length} activities for user ${user_id}`);
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ message: 'Error fetching activity' });
    }
};

/**
 * @desc    Get detailed progress for the current user
 * @route   GET /api/analytics/progress
 * @access  Private
 */
const getDetailedProgress = async (req, res) => {
    const user_id = req.user.id;
    try {
        // 1. Get basic user stats
        const [userStats] = await db.query(
            'SELECT xp, current_streak, longest_streak, total_session_time_seconds, last_active_date FROM users WHERE id = ?',
            [user_id]
        );


        // 2. Get course-wise progress
        const [courseProgress] = await db.query(`
            SELECT 
                c.id as course_id, 
                c.title,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
                (SELECT COUNT(DISTINCT lp.lesson_id) 
                 FROM lesson_progress lp 
                 JOIN enrollments e ON lp.enrollment_id = e.id 
                 WHERE e.course_id = c.id AND e.user_id = ? AND lp.is_completed = 1) as completed_lessons_count,
                (SELECT GROUP_CONCAT(lp.lesson_id)
                 FROM lesson_progress lp
                 JOIN enrollments e ON lp.enrollment_id = e.id
                 WHERE e.course_id = c.id AND e.user_id = ? AND lp.is_completed = 1) as completed_lesson_ids
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = ?
        `, [user_id, user_id, user_id]);

        res.status(200).json({
            stats: {
                ...userStats[0],
                current_streak: gamification.getEffectiveStreak(userStats[0]),
                level: gamification.calculateLevel(userStats[0].xp || 0)
            },
            courses: courseProgress
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Error fetching progress' });
    }
};

/**
 * @desc    Get advanced AI-powered analytics and insights
 * @route   GET /api/analytics/advanced
 */
const getAdvancedAnalytics = async (req, res) => {
    const user_id = req.user.id;
    try {
        // 1. Activity Heatmap (Last 14 days)
        const [heatmap] = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM user_activity_logs 
            WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 14 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [user_id]);

        // 2. Category Distribution
        const [distribution] = await db.query(`
            SELECT cat.name, COUNT(lp.id) as completion_count
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            JOIN course_categories cc ON c.id = cc.course_id
            JOIN categories cat ON cc.category_id = cat.id
            JOIN enrollments e ON lp.enrollment_id = e.id
            WHERE e.user_id = ? AND lp.is_completed = 1
            GROUP BY cat.name
        `, [user_id]);

        // 3. AI Learning Persona Generation
        // Fetch some raw data for the AI to analyze
        const [stats] = await db.query('SELECT xp, current_streak, total_session_time_seconds FROM users WHERE id = ?', [user_id]);
        
        const aiService = require('../services/aiService');
        const personaPrompt = `
            Analyze this student's learning data and provide a short, professional "Learning Persona" (max 30 words).
            Data: XP: ${stats[0].xp}, Streak: ${stats[0].current_streak}, Total Seconds: ${stats[0].total_session_time_seconds}.
            Distributions: ${JSON.stringify(distribution)}.
            Focus on their strengths (consistency, speed, or focus area).
        `;
        
        let persona = "Dynamic Learner: Shows consistent interest across multiple subjects with a focus on practical application.";
        try {
            const aiResponse = await aiService.generateText(personaPrompt);
            if (aiResponse) persona = aiResponse;
        } catch (e) {
            console.warn('AI Persona generation failed, using fallback');
        }

        res.status(200).json({
            heatmap,
            distribution,
            persona
        });

    } catch (error) {
        console.error('Advanced analytics error:', error);
        res.status(500).json({ message: 'Error fetching advanced analytics' });
    }
};

/**
 * @desc    Mark a lesson as completed
 * @route   POST /api/tracking/complete-lesson
 * @access  Private
 */
const completeLesson = async (req, res) => {
    const { enrollment_id, lesson_id, watch_time_seconds = 0 } = req.body;
    const user_id = req.user.id;

    if (!enrollment_id || !lesson_id) {
        return res.status(400).json({ message: 'enrollment_id and lesson_id are required' });
    }

    try {
        // 1. Check if already completed to prevent double XP
        const [existing] = await db.query(
            'SELECT is_completed FROM lesson_progress WHERE enrollment_id = ? AND lesson_id = ?',
            [enrollment_id, lesson_id]
        );

        if (existing.length > 0 && existing[0].is_completed) {
            return res.status(200).json({ message: 'Lesson already completed', alreadyDone: true });
        }

        // 2. Mark lesson as completed in progress table
        await db.query(
            `INSERT INTO lesson_progress (id, enrollment_id, lesson_id, is_completed, watch_time_seconds) 
             VALUES (?, ?, ?, 1, ?)
             ON DUPLICATE KEY UPDATE 
             is_completed = 1, watch_time_seconds = GREATEST(watch_time_seconds, ?)`,
            [uuidv4(), enrollment_id, lesson_id, watch_time_seconds, watch_time_seconds]
        );

        // 2. Award XP for lesson completion (50 XP)
        await gamification.awardXP(user_id, 50);

        // 3. Log the completion event
        await db.query(
            'INSERT INTO user_activity_logs (id, user_id, action_type, target_id) VALUES (?, ?, \'COMPLETE_LESSON\', ?)',
            [uuidv4(), user_id, lesson_id]
        );

        // 4. Check for course completion
        const [enrollment] = await db.query('SELECT course_id FROM enrollments WHERE id = ?', [enrollment_id]);
        if (enrollment.length > 0) {
            const course_id = enrollment[0].course_id;

            // Count total lessons in course
            const [lessons] = await db.query('SELECT id FROM lessons WHERE course_id = ?', [course_id]);
            
            // Count completed lessons for this enrollment
            const [completed] = await db.query(`
                SELECT lesson_id FROM lesson_progress 
                WHERE enrollment_id = ? AND is_completed = 1
            `, [enrollment_id]);

            // Update completion percentage in course_progress
            const totalLessonsCount = lessons.length > 0 ? lessons.length : 1;
            const percentage = Math.min(100, Math.round((completed.length / totalLessonsCount) * 100));
            
            await db.query(
                `INSERT INTO course_progress (id, enrollment_id, completion_percentage) 
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE completion_percentage = ?`,
                [uuidv4(), enrollment_id, percentage, percentage]
            );

            if (completed.length >= totalLessonsCount) {
                // COURSE IS COMPLETED!
                await db.query(
                    'UPDATE enrollments SET status = \'completed\' WHERE id = ?',
                    [enrollment_id]
                );

                // Award Course Completion XP (200 XP)
                await gamification.awardXP(user_id, 200);

                // Gather student insights for AI Evaluation
                const [quizAttempts] = await db.query(`
                    SELECT qa.score_percentage 
                    FROM quiz_attempts qa 
                    JOIN quizzes q ON qa.quiz_id = q.id 
                    WHERE qa.user_id = ? AND q.lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)
                `, [user_id, course_id]);

                const avgQuizScore = quizAttempts.length > 0 
                    ? Math.round(quizAttempts.reduce((acc, curr) => acc + parseFloat(curr.score_percentage), 0) / quizAttempts.length)
                    : 0;

                const [chatLogs] = await db.query(`
                    SELECT user_query 
                    FROM ai_chat_logs 
                    WHERE user_id = ? AND lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)
                `, [user_id, course_id]);
                
                const questionsAsked = chatLogs.length;
                
                const [userStats] = await db.query(`
                    SELECT first_name, last_name 
                    FROM users WHERE id = ?
                `, [user_id]);

                const studentName = userStats[0] ? `${userStats[0].first_name} ${userStats[0].last_name}` : 'Student';
                
                const [courseInfo] = await db.query('SELECT title FROM courses WHERE id = ?', [course_id]);
                const courseTitle = courseInfo[0] ? courseInfo[0].title : 'the course';

                const aiPrompt = `
You are an expert AI educator evaluating a student who just graduated from your course.
Write a highly personalized, enthusiastic, and professional 3-sentence certificate evaluation.

Student: ${studentName}
Course: ${courseTitle}
Average Quiz Score: ${avgQuizScore}%
Questions Asked to AI Tutor: ${questionsAsked}

Acknowledge their specific metrics. Be encouraging and highlight their dedication.
                `;
                
                let aiEvaluation = '';
                try {
                    aiEvaluation = await generateText(aiPrompt);
                } catch (e) {
                    console.error('Failed to generate AI evaluation:', e);
                    aiEvaluation = `Congratulations ${studentName} on successfully completing ${courseTitle}! Your dedication to learning and mastering the concepts is highly commendable.`;
                }

                // Issue Certificate (Check if already exists)
                const [existingCert] = await db.query(
                    'SELECT id FROM certificates WHERE user_id = ? AND course_id = ?',
                    [user_id, course_id]
                );

                if (existingCert.length === 0) {
                    const verificationCode = `LL-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
                    await db.query(
                        'INSERT INTO certificates (id, user_id, course_id, verification_code, ai_evaluation) VALUES (?, ?, ?, ?, ?)',
                        [uuidv4(), user_id, course_id, verificationCode, aiEvaluation]
                    );
                }
            }
        }

        res.status(200).json({ message: 'Lesson marked as completed' });
    } catch (error) {
        console.error('Complete lesson error:', error);
        res.status(500).json({ message: 'Server error completing lesson', details: error.message });
    }
};

/**
 * @desc    Get AI predicted dropout risk for a student
 * @route   GET /api/analytics/student-risk/:userId
 * @access  Private
 */
const getStudentRisk = async (req, res) => {
    const { userId } = req.params;
    
    try {
        // 1. Gather stats
        const [user] = await db.query('SELECT last_active_date, total_session_time_seconds FROM users WHERE id = ?', [userId]);
        if (!user.length) return res.status(404).json({ message: 'User not found' });
        
        let days_since_last_login = 0;
        if (user[0].last_active_date) {
            const diffTime = Math.abs(new Date() - new Date(user[0].last_active_date));
            days_since_last_login = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const total_watch_time_mins = Math.round((user[0].total_session_time_seconds || 0) / 60);

        const [quizzes] = await db.query('SELECT score_percentage FROM quiz_attempts WHERE user_id = ?', [userId]);
        const avg_quiz_score = quizzes.length > 0 
            ? quizzes.reduce((acc, curr) => acc + parseFloat(curr.score_percentage), 0) / quizzes.length 
            : 0;

        const quiz_success_rate = quizzes.length > 0 ? (quizzes.filter(q => parseFloat(q.score_percentage) >= 80).length / quizzes.length) * 100 : 0;
        const quiz_failure_rate = quizzes.length > 0 ? (quizzes.filter(q => parseFloat(q.score_percentage) < 50).length / quizzes.length) * 100 : 0;

        const [chats] = await db.query('SELECT COUNT(*) as count FROM ai_chat_logs WHERE user_id = ?', [userId]);
        const ai_tutor_interactions = chats[0].count;

        const [completed] = await db.query(
            'SELECT COUNT(*) as count FROM lesson_progress lp JOIN enrollments e ON lp.enrollment_id = e.id WHERE e.user_id = ? AND lp.is_completed = TRUE', 
            [userId]
        );
        const completed_lessons = completed[0].count;

        // Skip Rate Calculation
        const [lessonStats] = await db.query(`
            SELECT lp.watch_time_seconds, l.video_duration_seconds 
            FROM lesson_progress lp 
            JOIN enrollments e ON lp.enrollment_id = e.id 
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE e.user_id = ? AND lp.is_completed = TRUE
        `, [userId]);

        let total_skips = 0;
        lessonStats.forEach(stat => {
            // If they watched less than 70% of a video > 60 seconds
            if (stat.video_duration_seconds > 60 && stat.watch_time_seconds < (stat.video_duration_seconds * 0.7)) {
                total_skips++;
            }
        });
        const video_skip_rate = lessonStats.length > 0 ? (total_skips / lessonStats.length) * 100 : 0;

        // Focus Score System
        let focus_score = 100;
        focus_score -= (days_since_last_login * 2); // -2 per inactive day
        focus_score -= (video_skip_rate * 0.5); // -50 if they skipped everything
        focus_score -= (quiz_failure_rate * 0.3); // -30 if they failed everything
        focus_score += (ai_tutor_interactions * 1.5); // +1.5 per AI interaction
        focus_score = Math.max(0, Math.min(100, Math.round(focus_score)));

        const payload = {
            days_since_last_login,
            avg_quiz_score: Math.round(avg_quiz_score),
            total_watch_time_mins,
            ai_tutor_interactions,
            completed_lessons,
            video_skip_rate: Math.round(video_skip_rate),
            quiz_success_rate: Math.round(quiz_success_rate),
            quiz_failure_rate: Math.round(quiz_failure_rate)
        };

        // 2. Call ML API
        const mlApiUrl = process.env.ML_API_URL || 'http://127.0.0.1:5001';
        const response = await fetch(`${mlApiUrl}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('ML API responded with error');
        }

        const data = await response.json();

        res.json({
            studentId: userId,
            stats: payload,
            focus_score,
            dropout_risk_percentage: data.dropout_risk_percentage
        });

    } catch (error) {
        console.error('Error fetching student risk:', error);
        res.status(500).json({ message: 'Error analyzing student risk', details: error.message });
    }
};

module.exports = {
    updateSession,
    logEvent,
    updateWatchTime,
    getUserActivity,
    getDetailedProgress,
    getAdvancedAnalytics,
    completeLesson,
    getStudentRisk
};
