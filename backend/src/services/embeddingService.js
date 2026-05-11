const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { AI_MODELS } = require('../config/aiConfig');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Split text into overlapping chunks.
 */
function chunkText(text, chunkSize = 500, overlap = 100) {
    if (!text || text.length === 0) return [];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        let end = Math.min(start + chunkSize, text.length);
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > start + (chunkSize * 0.5)) {
                end = breakPoint + 1;
            }
        }
        const chunk = text.substring(start, end).trim();
        if (chunk.length > 0) chunks.push(chunk);
        const nextStart = end - overlap;
        start = nextStart > start ? nextStart : end;
        if (start >= text.length) break;
    }
    return chunks;
}

/**
 * Generate embedding for a text string.
 */
async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODELS.EMBEDDING });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('❌ Embedding API Error:', error.message);
        throw new Error(`Embedding failed: ${error.message}`);
    }
}

/**
 * Process a lesson for embeddings.
 */
async function processLesson(lessonId) {
    const [lessons] = await db.query('SELECT content_text FROM lessons WHERE id = ?', [lessonId]);
    if (lessons.length === 0 || !lessons[0].content_text) return;
    const text = lessons[0].content_text;
    await db.query('DELETE FROM lesson_chunks WHERE lesson_id = ?', [lessonId]);
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
        const chunkId = uuidv4();
        try {
            const embedding = await generateEmbedding(chunks[i]);
            await db.query(
                'INSERT INTO lesson_chunks (id, lesson_id, chunk_text, chunk_index, embedding, token_count) VALUES (?, ?, ?, ?, ?, ?)',
                [chunkId, lessonId, chunks[i], i, JSON.stringify(embedding), chunks[i].length]
            );
        } catch (err) {
            await db.query(
                'INSERT INTO lesson_chunks (id, lesson_id, chunk_text, chunk_index, token_count) VALUES (?, ?, ?, ?, ?)',
                [chunkId, lessonId, chunks[i], i, chunks[i].length]
            );
        }
    }
}

/**
 * Search for relevant chunks (Semantic with Keyword Fallback).
 */
async function semanticSearch(query, courseId, topK = 5) {
    try {
        // 1. Try Semantic Search
        const queryEmbedding = await generateEmbedding(query);
        const [chunks] = await db.query(
            `SELECT lc.*, l.title as lesson_title FROM lesson_chunks lc
             JOIN lessons l ON lc.lesson_id = l.id
             WHERE l.course_id = ? AND lc.embedding IS NOT NULL`,
            [courseId]
        );
        
        if (chunks.length > 0) {
            const scored = chunks.map(c => ({
                ...c,
                similarity: cosineSimilarity(queryEmbedding, JSON.parse(c.embedding))
            }));
            return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
        }
    } catch (err) {
        console.warn('⚠️ Semantic Search failed, falling back to Keyword:', err.message);
    }

    // 2. Keyword Fallback
    const [fallback] = await db.query(
        `SELECT lc.*, l.title as lesson_title, 0.5 as similarity FROM lesson_chunks lc
         JOIN lessons l ON lc.lesson_id = l.id
         WHERE l.course_id = ? AND (lc.chunk_text LIKE ? OR l.title LIKE ?)
         LIMIT ?`,
        [courseId, `%${query}%`, `%${query}%`, topK]
    );
    
    if (fallback.length > 0) return fallback;

    // 3. Ultimate Fallback: Just return the first few chunks of the course so the AI has SOME context
    const [lastResort] = await db.query(
        `SELECT lc.*, l.title as lesson_title, 0.1 as similarity FROM lesson_chunks lc
         JOIN lessons l ON lc.lesson_id = l.id
         WHERE l.course_id = ?
         LIMIT ?`,
        [courseId, topK]
    );
    
    return lastResort;
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
    chunkText,
    processLesson,
    generateEmbedding,
    semanticSearch
};
