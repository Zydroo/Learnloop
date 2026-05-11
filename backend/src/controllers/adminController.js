const db = require('../db');
const gamification = require('../services/gamificationService');


/**
 * Get overall platform statistics for admin
 */
const getStats = async (req, res) => {
    try {
        // 1. Total Students
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        
        // 2. Active Courses (Published)
        const [publishedCount] = await db.query('SELECT COUNT(*) as count FROM courses WHERE is_published = 1');
        
        // 3. Recent Courses
        const [recentCourses] = await db.query('SELECT id, title, thumbnail_url, created_at FROM courses ORDER BY created_at DESC LIMIT 5');

        // 4. Global Platform Stats
        const [platformStats] = await db.query('SELECT SUM(xp) as totalXp, SUM(total_session_time_seconds) as totalTime FROM users');


        // 4. Avg Progression
        const [avgProgress] = await db.query('SELECT AVG(completion_percentage) as avg FROM course_progress');

        // 5. Platform Engagement (Enrollments per month)
        const [engagement] = await db.query(`
            SELECT MONTH(enrolled_at) as month, COUNT(*) as count 
            FROM enrollments 
            WHERE YEAR(enrolled_at) = YEAR(CURDATE()) 
            GROUP BY MONTH(enrolled_at)
            ORDER BY month ASC
        `);

        // Map months to a full 12-month array
        const engagementData = Array(12).fill(0);
        engagement.forEach(row => {
            engagementData[row.month - 1] = row.count;
        });

        res.json({
            totalStudents: userCount[0].count,
            activeCourses: publishedCount[0].count,
            recentCourses: recentCourses,
            avgProgression: Math.round(avgProgress[0].avg || 0) + '%',
            engagement: engagementData,
            trends: {
                students: '+12%',
                courses: '+2',
                progression: '+5%',
                totalXp: platformStats[0].totalXp || 0,
                totalTime: platformStats[0].totalTime || 0
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
};

/**
 * Get all students with their enrollment counts and avg progress
 */
const getStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.email,
                u.xp,
                u.current_streak,
                u.last_active_date,
                (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as course_count,
                (SELECT AVG(cp.completion_percentage) FROM course_progress cp 
                 JOIN enrollments e2 ON cp.enrollment_id = e2.id 
                 WHERE e2.user_id = u.id) as avg_progress,
                (SELECT AVG(qa.score_percentage) FROM quiz_attempts qa WHERE qa.user_id = u.id) as avg_score
            FROM users u
            WHERE u.email NOT LIKE '%admin%'

        `;
        const [students] = await db.query(query);
        
        res.json(students.map(s => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            email: s.email,
            courses: s.course_count,
            progress: Math.round(s.avg_progress || 0),
            score: Math.round(s.avg_score || 0),
            xp: s.xp,
            streak: gamification.getEffectiveStreak(s),
            status: 'Active'
        })));

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching students' });
    }
};

/**
 * Get recent platform activity
 */
const getActivity = async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT u.first_name, u.last_name, l.action_type as action, l.created_at 
            FROM user_activity_logs l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT 10
        `);
        
        res.json(logs.map(l => ({
            name: `${l.first_name} ${l.last_name}`,
            action: l.action,
            time: l.created_at
        })));
    } catch (error) {
        // Fallback if logs table is empty or has issues
        res.json([
            { name: 'System', action: 'Admin dashboard initialized', time: new Date() }
        ]);
    }
};

const axios = require('axios');

/**
 * Extract playlist ID from a YouTube URL
 */
const extractPlaylistId = (url) => {
    const regExp = /[&?]list=([^&]+)/i;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
};

/**
 * Parse a YouTube playlist and return lessons
 */
const parsePlaylist = async (req, res) => {
    const { url } = req.body;
    const playlistId = extractPlaylistId(url);
    const apiKey = process.env.YOUTUBE_API_KEY;

    console.log('🔍 Debug: YouTube API Key detected?', !!apiKey);

    if (!playlistId) {
        return res.status(400).json({ message: 'Invalid YouTube Playlist URL' });
    }

    if (!apiKey) {
        return res.status(500).json({ 
            message: 'YouTube API Key missing in .env. Please add YOUTUBE_API_KEY to your backend .env file.' 
        });
    }

    try {
        // 1. Get Playlist Items (Lessons)
        const itemsResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
            params: {
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 50,
                key: apiKey
            }
        });

        // 2. Get Playlist Details (for Thumbnail)
        const playlistResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlists`, {
            params: {
                part: 'snippet',
                id: playlistId,
                key: apiKey
            }
        });

        const lessons = itemsResponse.data.items.map(item => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
        }));

        const thumbnail = playlistResponse.data.items[0]?.snippet?.thumbnails?.high?.url || 
                        playlistResponse.data.items[0]?.snippet?.thumbnails?.default?.url;

        res.json({ lessons, thumbnail });
    } catch (error) {
        console.error('YouTube API Error:', error.response?.data || error.message);
        res.status(500).json({ 
            message: 'Failed to fetch playlist items. Ensure your API key is valid and the playlist is public.' 
        });
    }
};

const { YoutubeTranscript } = require('youtube-transcript');
const { generateJSON } = require('../services/aiService');
const { processLesson } = require('../services/embeddingService');

/**
 * Automatically fetch transcript from a video, refine it with AI, and save it.
 */
const extractTranscript = async (req, res) => {
    const { lessonId } = req.params;

    try {
        // 1. Get lesson details
        const [lessons] = await db.query('SELECT title, video_url FROM lessons WHERE id = ?', [lessonId]);
        if (lessons.length === 0) return res.status(404).json({ message: 'Lesson not found' });
        
        const { title, video_url } = lessons[0];
        if (!video_url) return res.status(400).json({ message: 'Lesson has no video URL' });

        // Extract Video ID
        const videoIdMatch = video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : video_url;

        // 2. Fetch transcript from YouTube
        let transcriptLines;
        let rawTranscript = '';
        const apiKey = process.env.YOUTUBE_API_KEY;

        try {
            transcriptLines = await YoutubeTranscript.fetchTranscript(videoId);
            rawTranscript = transcriptLines.map(t => t.text).join(' ');
        } catch (err) {
            console.warn('Transcript fetch failed, trying description fallback...');
            
            if (apiKey) {
                try {
                    const videoResponse = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                        params: { part: 'snippet', id: videoId, key: apiKey }
                    });
                    const description = videoResponse.data.items[0]?.snippet?.description;
                    if (description && description.length > 100) {
                        rawTranscript = `[TRANSCRIPT FALLBACK: VIDEO DESCRIPTION]\n\n${description}`;
                    }
                } catch (apiErr) {
                    console.error('YouTube API Fallback failed:', apiErr.message);
                }
            }
        }

        if (!rawTranscript || rawTranscript.length < 50) {
            return res.status(404).json({ 
                message: `Could not find captions or a detailed description for Video [${videoId}].` 
            });
        }

        // SMART TRUNCATION: If transcript is massive (>20k chars), keep the start and end
        // This ensures we stay within AI free-tier limits (like Groq's 6k token limit)
        if (rawTranscript.length > 20000) {
            console.info(`📏 Content too long (${rawTranscript.length} chars). Truncating for AI limits...`);
            const start = rawTranscript.substring(0, 12000);
            const end = rawTranscript.substring(rawTranscript.length - 8000);
            rawTranscript = `${start}\n\n[... content truncated for brevity ...]\n\n${end}`;
        }

        // 3. Send to Gemini/Groq for refinement
        const data = await generateJSON(`
            Rewrite this raw content into a clear, professional educational lesson.
            Use markdown formatting. Add headings and bullet points.
            
            LESSON TITLE: ${title}
            CONTENT:
            ${rawTranscript}
            
            Return ONLY a valid JSON object:
            { "refined_lesson": "The markdown content here..." }
        `);

        // 4. Save to database
        await db.query(
            'UPDATE lessons SET content_text = ? WHERE id = ?',
            [data.refined_lesson, lessonId]
        );

        // 5. Process embeddings in the background
        processLesson(lessonId).catch(err => console.error('Embedding failed:', err.message));

        res.json({ message: 'Transcript extracted successfully!', content_text: data.refined_lesson });

    } catch (error) {
        console.error('Final Extraction Error:', error.message);
        res.status(500).json({ 
            message: 'Extraction failed at a critical step.',
            error: error.message,
            tip: 'Check if your Gemini API key is valid and if the video is accessible.'
        });
    }
};

/**
 * Get detailed insights for a specific student
 */
const getStudentDetails = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Basic Info & Gamification
        const [users] = await db.query(
            'SELECT id, first_name, last_name, email, xp, current_streak, last_active_date, total_session_time_seconds, created_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) return res.status(404).json({ message: 'Student not found' });
        const user = users[0];

        // 2. Course Enrollments & Progress
        const [enrollments] = await db.query(`
            SELECT c.title, e.enrolled_at, e.status, cp.completion_percentage
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
            WHERE e.user_id = ?
        `, [id]);

        // 3. Recent Activity Logs
        const [activity] = await db.query(`
            SELECT action_type, metadata, created_at 
            FROM user_activity_logs 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [id]);

        // 4. Quiz Performance
        const [quizzes] = await db.query(`
            SELECT q.lesson_id, qa.score_percentage, qa.attempted_at
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = ?
            ORDER BY qa.attempted_at DESC
        `, [id]);

        res.json({
            profile: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                joined: user.created_at,
                xp: user.xp,
                streak: gamification.getEffectiveStreak(user),
                totalTime: user.total_session_time_seconds

            },
            courses: enrollments,
            activity: activity,
            quizzes: quizzes
        });
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ message: 'Error fetching student details' });
    }
};

/**
 * @desc    Publish or unpublish a course
 * @route   PATCH /api/admin/courses/:id/status
 * @access  Admin
 */
const updateCourseStatus = async (req, res) => {
    const { id } = req.params;
    const { isPublished } = req.body;

    try {
        await db.query('UPDATE courses SET is_published = ? WHERE id = ?', [isPublished, id]);
        res.status(200).json({ message: `Course ${isPublished ? 'published' : 'unpublished'} successfully.` });
    } catch (error) {
        console.error('Error updating course status:', error);
        res.status(500).json({ message: 'Server error updating course status' });
    }
};

module.exports = { 
    getStats, 
    getStudents, 
    getActivity, 
    parsePlaylist, 
    extractTranscript,
    getStudentDetails,
    updateCourseStatus
};
