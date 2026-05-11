const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateText } = require('../services/aiService');
const { semanticSearch, processLesson } = require('../services/embeddingService');

/**
 * ============================================================
 * AI CONTROLLER — Upgraded with Semantic Search RAG
 * ============================================================
 * 
 * BEFORE: Dumped ALL lesson text into the prompt (slow, expensive).
 * NOW:    Uses vector embeddings to find only the most relevant
 *         chunks and sends those to Gemini (fast, precise).
 * ============================================================
 */

/**
 * @desc    Ask the AI Tutor (RAG with semantic search)
 * @route   POST /api/ai/ask
 */
const askAssistant = async (req, res) => {
    const { course_id, question, conversation_id } = req.body;

    if (!course_id || !question) {
        return res.status(400).json({ message: 'course_id and question are required.' });
    }

    try {
        // 1. Semantic search: find the most relevant chunks
        const relevantChunks = await semanticSearch(question, course_id, 5);
        
        if (relevantChunks.length === 0) {
            return res.status(404).json({ message: 'No lesson content available for this course.' });
        }

        // 2. Build context from the best matching chunks
        const context = relevantChunks
            .map(c => `[From: ${c.lesson_title}]\n${c.chunk_text}`)
            .join('\n\n---\n\n');

        // 3. Get conversation history if provided
        let history = '';
        if (conversation_id) {
            const [messages] = await db.query(
                'SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 10',
                [conversation_id]
            );
            history = messages.reverse().map(m => `${m.role}: ${m.content}`).join('\n');
        }

        // 4. Build the prompt
        const prompt = `
            You are LearnLoop AI Tutor — a friendly, knowledgeable assistant.
            
            RULES:
            - Answer based ONLY on the provided course content below.
            - If the answer isn't in the content, say "This isn't covered in the current course material."
            - Use clear language. Support both English and Arabic if the student writes in Arabic.
            - Be encouraging and supportive.
            - Use markdown formatting for readability.
            
            RELEVANT COURSE CONTENT:
            ${context}
            
            ${history ? `CONVERSATION HISTORY:\n${history}\n` : ''}
            
            STUDENT QUESTION: ${question}
        `;

        // 5. Generate response
        const aiResponse = await generateText(prompt);

        // 6. Save to conversation
        let convId = conversation_id;
        if (!convId) {
            convId = uuidv4();
            await db.query(
                'INSERT INTO ai_conversations (id, user_id, course_id, title) VALUES (?, ?, ?, ?)',
                [convId, req.user.id, course_id, question.substring(0, 100)]
            );
        }

        // Save user message
        await db.query(
            'INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
            [uuidv4(), convId, 'user', question]
        );

        // Save AI response
        await db.query(
            'INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
            [uuidv4(), convId, 'assistant', aiResponse]
        );

        // Also log to the legacy table for backward compatibility
        await db.query(
            'INSERT INTO ai_chat_logs (id, user_id, user_query, ai_response) VALUES (UUID(), ?, ?, ?)',
            [req.user.id, question, aiResponse]
        );

        // Award XP for asking AI
        const gamification = require('../services/gamificationService');
        await gamification.awardXP(req.user.id, gamification.XP_ACTIONS.ASK_AI);

        res.status(200).json({
            answer: aiResponse,
            conversation_id: convId,
            sources: relevantChunks.map(c => ({
                lesson_title: c.lesson_title,
                lesson_id: c.lesson_id,
                relevance: Math.round(c.similarity * 100) + '%'
            }))
        });

    } catch (error) {
        console.error('❌ AI Tutor Error:', error.message);
        res.status(500).json({ message: 'AI processing failed.', error: error.message });
    }
};

/**
 * @desc    Ask the Global AI Tutor (Platform Guide & Course Creator)
 * @route   POST /api/ai/ask-global
 */
const askGlobalAssistant = async (req, res) => {
    const { question, conversation_id } = req.body;
    const { v4: uuidv4 } = require('uuid');

    if (!question) {
        return res.status(400).json({ message: 'question is required.' });
    }

    try {
        // 1. Get conversation history if provided
        let history = '';
        if (conversation_id) {
            const [messages] = await db.query(
                'SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 10',
                [conversation_id]
            );
            history = messages.reverse().map(m => `${m.role}: ${m.content}`).join('\n');
        }

        // 2. Fetch available courses to provide context
        const [courses] = await db.query('SELECT id, title, description FROM courses WHERE is_published = 1 LIMIT 20');
        const courseContext = courses.map(c => `- ${c.title}: ${c.description}`).join('\n');

        // 3. Build the prompt
        const prompt = `
            You are LearnLoop Global AI Tutor — an omniscient platform guide.
            
            YOUR CAPABILITIES:
            1. Suggest available courses to students based on their interests.
            2. Answer general questions about how to use the platform.
            3. *FIND NEW COURSES*: If a user asks to learn a topic that isn't in our available courses (like Python, React, etc.), you MUST generate a specific YouTube search query (e.g., "Python programming full course") so I can find playlists for them. DO NOT just tell them to search themselves.
            4. *CREATE COURSES FROM YOUTUBE PLAYLISTS*: If they provide a YouTube Playlist URL (e.g. youtube.com/playlist?list=...), you MUST extract the URL and tell them you are creating it.
            
            AVAILABLE COURSES ON PLATFORM:
            ${courseContext || 'No courses currently available.'}
            
            CONVERSATION HISTORY:
            ${history}
            
            STUDENT MESSAGE: ${question}
            
            IMPORTANT: Return your response EXACTLY in this JSON format:
            {
              "answer": "Your conversational reply to the student in Markdown.",
              "youtube_playlist_url": "Only if they provided a valid youtube playlist URL in their message, put it here. Otherwise, leave null.",
              "search_query": "If the topic requested is NOT in the available courses list, put a YouTube search query here (e.g., 'Python course for beginners'). MANDATORY if topic is missing. Otherwise, leave null."
            }
        `;

        // 4. Generate JSON response
        const aiResponseJSON = await require('../services/aiService').generateJSON(prompt);
        
        let aiResponseText = aiResponseJSON.answer || "I'm here to help!";
        let detectedPlaylistUrl = aiResponseJSON.youtube_playlist_url || null;
        let searchQuery = aiResponseJSON.search_query || null;
        let youtubeSuggestions = [];

        // If they provided a URL directly
        if (detectedPlaylistUrl) {
            aiResponseText += "\n\n🚀 *I have detected a YouTube Playlist! I am automatically generating a new course for you right now...*";
        } 
        // If they asked for a new topic, let's search YouTube for them
        else if (searchQuery) {
            try {
                const axios = require('axios');
                const apiKey = process.env.YOUTUBE_API_KEY;
                if (apiKey) {
                    const ytRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                        params: {
                            part: 'snippet',
                            q: searchQuery,
                            type: 'playlist',
                            maxResults: 3,
                            key: apiKey
                        }
                    });
                    
                    if (ytRes.data.items && ytRes.data.items.length > 0) {
                        youtubeSuggestions = ytRes.data.items.map(item => ({
                            id: item.id.playlistId,
                            title: item.snippet.title,
                            description: item.snippet.description,
                            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
                            url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`
                        }));
                        aiResponseText += "\n\n✨ **I found some great courses on YouTube!** Click 'Generate Course' on any of these cards to instantly import it into LearnLoop.";
                    }
                }
            } catch (err) {
                console.error('YouTube Search Failed:', err.message);
            }
        }

        // 5. Save to conversation
        let convId = conversation_id;
        if (!convId) {
            convId = uuidv4();
            await db.query(
                'INSERT INTO ai_conversations (id, user_id, course_id, title) VALUES (?, ?, ?, ?)',
                [convId, req.user.id, null, question.substring(0, 100)]
            );
        }

        // Save user message
        await db.query(
            'INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
            [uuidv4(), convId, 'user', question]
        );

        // Save AI response
        await db.query(
            'INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
            [uuidv4(), convId, 'assistant', aiResponseText]
        );

        res.status(200).json({
            answer: aiResponseText,
            conversation_id: convId,
            create_course_url: detectedPlaylistUrl,
            youtube_suggestions: youtubeSuggestions,
            sources: []
        });

    } catch (error) {
        console.error('❌ Global AI Tutor Error:', error.message);
        res.status(500).json({ message: 'AI processing failed.', error: error.message });
    }
};

/**
 * @desc    Get user's conversation history
 * @route   GET /api/ai/conversations
 */
const getConversations = async (req, res) => {
    try {
        const [conversations] = await db.query(
            `SELECT c.*, 
                (SELECT COUNT(*) FROM ai_messages WHERE conversation_id = c.id) as message_count
             FROM ai_conversations c 
             WHERE c.user_id = ? 
             ORDER BY c.updated_at DESC 
             LIMIT 20`,
            [req.user.id]
        );
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch conversations.' });
    }
};

/**
 * @desc    Get messages for a conversation
 * @route   GET /api/ai/conversations/:id/messages
 */
const getConversationMessages = async (req, res) => {
    try {
        const [messages] = await db.query(
            'SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
            [req.params.id]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages.' });
    }
};

/**
 * @desc    Ingest raw transcripts, refine them, and generate quizzes
 * @route   POST /api/admin/ingest
 */
const ingestTranscript = async (req, res) => {
    const { course_id, lesson_title, raw_transcript } = req.body;

    try {
        // 1. Validation: Ensure course exists
        const [course] = await db.query('SELECT id FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 2. Gemini Prompt
        const data = await require('../services/aiService').generateJSON(`
            Rewrite this transcript into a clear, professional educational lesson.
            Then, generate 5 multiple-choice questions based on that content.

            TRANSCRIPT:
            ${raw_transcript}

            Return the data ONLY in this JSON format:
            { 
              "refined_lesson": "...", 
              "quiz": [ 
                { "question": "...", "options": ["...", "..."], "correct_answer": "..." } 
              ] 
            }
        `);

        // 3. Database Logic
        const lesson_id = uuidv4();
        const quiz_id = uuidv4();

        await db.query('START TRANSACTION');

        await db.query(
            'INSERT INTO lessons (id, course_id, title, content_text, sequence_order) VALUES (?, ?, ?, ?, ?)',
            [lesson_id, course_id, lesson_title, data.refined_lesson, 0]
        );

        await db.query(
            'INSERT INTO quizzes (id, lesson_id, ai_generated_json) VALUES (?, ?, ?)',
            [quiz_id, lesson_id, JSON.stringify(data.quiz)]
        );

        await db.query('COMMIT');

        // 4. Process embeddings asynchronously (don't block the response)
        processLesson(lesson_id).catch(err => 
            console.error('⚠️ Background embedding failed:', err.message)
        );

        res.status(201).json({
            message: 'Transcript ingested successfully!',
            lesson_id,
            quiz_id
        });

    } catch (error) {
        await db.query('ROLLBACK').catch(() => {});
        console.error('Ingestion Error:', error);
        res.status(500).json({ message: 'Ingestion failed.', error: error.message });
    }
};

module.exports = { askAssistant, askGlobalAssistant, getConversations, getConversationMessages, ingestTranscript };
