const db = require('../db');
const { semanticSearch } = require('../services/embeddingService');

/**
 * ============================================================
 * SEARCH CONTROLLER — AI Video Search + Lesson Search
 * ============================================================
 * 
 * Students can ask "Where was X explained?" and get:
 * - The exact lesson
 * - Relevant text snippet
 * - Similarity score (how confident the match is)
 * ============================================================
 */

/**
 * @desc    Semantic search across all lesson content
 * @route   POST /api/search/lessons
 */
const searchLessons = async (req, res) => {
    const { query, course_id } = req.body;

    if (!query) {
        return res.status(400).json({ message: 'Search query is required.' });
    }

    try {
        // 1. Semantic Search (AI)
        const semanticResults = await semanticSearch(query, course_id, 10);
        
        // 2. Keyword Search (SQL fallback for titles/descriptions)
        let sql = 'SELECT id as lesson_id, title as lesson_title, course_id, SUBSTRING(content_text, 1, 300) as snippet FROM lessons WHERE (title LIKE ? OR content_text LIKE ?)';
        const params = [`%${query}%`, `%${query}%`];
        if (course_id) {
            sql += ' AND course_id = ?';
            params.push(course_id);
        }
        const [keywordResults] = await db.query(sql, params);

        // 3. Merge and Deduplicate
        const merged = [...semanticResults.map(r => ({
            lesson_id: r.lesson_id,
            lesson_title: r.lesson_title,
            course_id: r.course_id,
            snippet: r.chunk_text.substring(0, 300) + '...',
            relevance: Math.round(r.similarity * 100) + '%'
        }))];

        keywordResults.forEach(kr => {
            if (!merged.find(m => m.lesson_id === kr.lesson_id)) {
                merged.push({
                    lesson_id: kr.lesson_id,
                    lesson_title: kr.lesson_title,
                    course_id: kr.course_id,
                    snippet: (kr.snippet || 'No snippet available') + '...',
                    relevance: 'Match'
                });
            }
        });
        
        res.json({
            query,
            results: merged
        });
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ message: 'Search failed.', error: error.message });
    }
};

/**
 * @desc    Search within video transcripts (returns timestamps)
 * @route   POST /api/search/video
 */
const searchVideo = async (req, res) => {
    const { query, course_id } = req.body;

    if (!query) {
        return res.status(400).json({ message: 'Search query is required.' });
    }

    try {
        // 1. Search lesson content
        const results = await semanticSearch(query, course_id, 5);
        
        // 2. Check if any matching lessons have transcripts with timestamps
        const enrichedResults = [];
        for (const result of results) {
            const [transcripts] = await db.query(
                'SELECT timestamped_segments FROM lesson_transcripts WHERE lesson_id = ?',
                [result.lesson_id]
            );
            
            // 3. Get the lesson's video URL and course_id
            const [lessonInfo] = await db.query(
                'SELECT video_url, course_id FROM lessons WHERE id = ?',
                [result.lesson_id]
            );

            enrichedResults.push({
                lesson_id: result.lesson_id,
                lesson_title: result.lesson_title,
                course_id: result.course_id || lessonInfo[0]?.course_id,
                snippet: result.chunk_text.substring(0, 200),
                relevance: Math.round(result.similarity * 100) + '%',
                video_url: lessonInfo[0]?.video_url || null,
                timestamp: transcripts[0]?.timestamped_segments 
                    ? findTimestamp(transcripts[0].timestamped_segments, query)
                    : null
            });
        }

        res.json({ query, results: enrichedResults });
    } catch (error) {
        console.error('Video search error:', error.message);
        res.status(500).json({ message: 'Video search failed.' });
    }
};

/**
 * Find the best matching timestamp in a transcript.
 * @param {string|object} segments - JSON string or object of timestamped segments
 * @param {string} query - The search query
 * @returns {object|null} - { start, end, text } or null
 */
function findTimestamp(segments, query) {
    try {
        const parsed = typeof segments === 'string' ? JSON.parse(segments) : segments;
        if (!Array.isArray(parsed)) return null;
        
        const queryLower = query.toLowerCase();
        const match = parsed.find(seg => 
            seg.text && seg.text.toLowerCase().includes(queryLower)
        );
        
        return match || null;
    } catch {
        return null;
    }
}

module.exports = { searchLessons, searchVideo };
