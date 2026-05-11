const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateJSON, generateText } = require('./aiService');

/**
 * ============================================================
 * CONTENT GENERATOR SERVICE
 * ============================================================
 * 
 * Generates educational content from lesson material:
 * - Summaries with key points
 * - Flashcards (question/answer pairs)
 * - Quizzes (MCQ + True/False)
 * 
 * All generated content is stored in the database so it only
 * needs to be generated once per lesson.
 * ============================================================
 */

/**
 * Generate and store a lesson summary.
 * @param {string} lessonId 
 * @returns {object} The generated summary
 */
async function generateSummary(lessonId) {
    // 1. Get lesson content
    const [lessons] = await db.query(
        'SELECT title, content_text FROM lessons WHERE id = ?',
        [lessonId]
    );
    if (lessons.length === 0) throw new Error('Lesson not found');
    
    const { title, content_text } = lessons[0];
    if (!content_text) throw new Error('Lesson has no content to summarize');
    
    // 2. Check if summary already exists
    const [existing] = await db.query(
        'SELECT * FROM lesson_summaries WHERE lesson_id = ?',
        [lessonId]
    );
    if (existing.length > 0) return existing[0];
    
    // 3. Generate summary via AI
    const data = await generateJSON(`
        Analyze this lesson and create a structured summary.
        
        LESSON TITLE: ${title}
        LESSON CONTENT:
        ${content_text}
        
        Return ONLY valid JSON with this exact structure:
        {
            "summary_text": "A clear, concise summary of the lesson (2-3 paragraphs)",
            "key_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
            "difficulty_level": "beginner" or "intermediate" or "advanced"
        }
    `);
    
    // 4. Store in database
    const id = uuidv4();
    await db.query(
        'INSERT INTO lesson_summaries (id, lesson_id, summary_text, key_points, difficulty_level) VALUES (?, ?, ?, ?, ?)',
        [id, lessonId, data.summary_text, JSON.stringify(data.key_points), data.difficulty_level]
    );
    
    return { id, lesson_id: lessonId, ...data };
}

/**
 * Generate and store flashcards for a lesson.
 * @param {string} lessonId 
 * @param {number} count - Number of flashcards (default: 10)
 * @returns {object[]} Array of flashcard objects
 */
async function generateFlashcards(lessonId, count = 10) {
    // 1. Get lesson content
    const [lessons] = await db.query(
        'SELECT title, content_text FROM lessons WHERE id = ?',
        [lessonId]
    );
    if (lessons.length === 0) throw new Error('Lesson not found');
    
    const { title, content_text } = lessons[0];
    if (!content_text) throw new Error('Lesson has no content');
    
    // 2. Check if flashcards already exist
    const [existing] = await db.query(
        'SELECT * FROM flashcards WHERE lesson_id = ?',
        [lessonId]
    );
    if (existing.length > 0) return existing;
    
    // 3. Generate flashcards
    const data = await generateJSON(`
        Create ${count} educational flashcards from this lesson content.
        Each flashcard should test a key concept.
        
        LESSON: ${title}
        CONTENT:
        ${content_text}
        
        Return ONLY valid JSON:
        {
            "flashcards": [
                {
                    "front_text": "Question or concept to recall",
                    "back_text": "Answer or explanation",
                    "difficulty": 1
                }
            ]
        }
        
        difficulty: 1=easy, 2=medium, 3=hard
    `);
    
    // 4. Store each flashcard
    const flashcards = [];
    for (const card of data.flashcards) {
        const id = uuidv4();
        await db.query(
            'INSERT INTO flashcards (id, lesson_id, front_text, back_text, difficulty) VALUES (?, ?, ?, ?, ?)',
            [id, lessonId, card.front_text, card.back_text, card.difficulty || 1]
        );
        flashcards.push({ id, lesson_id: lessonId, ...card });
    }
    
    return flashcards;
}

/**
 * Generate a quiz for a lesson.
 * @param {string} lessonId 
 * @param {object} options - { questionCount, difficulty, type }
 * @returns {object} Quiz object with questions
 */
async function generateQuiz(lessonId, options = {}) {
    const { questionCount = 5, difficulty = 'mixed', type = 'mcq' } = options;
    
    // 1. Get lesson content
    const [lessons] = await db.query(
        'SELECT title, content_text FROM lessons WHERE id = ?',
        [lessonId]
    );
    if (lessons.length === 0) throw new Error('Lesson not found');
    
    const { title, content_text } = lessons[0];
    if (!content_text) throw new Error('Lesson has no content');
    
    // 2. Generate quiz
    const data = await generateJSON(`
        Create a ${questionCount}-question ${type === 'mixed' ? 'mixed (MCQ + True/False)' : 'multiple choice'} quiz
        based on this lesson.
        
        LESSON: ${title}
        CONTENT:
        ${content_text}
        
        Difficulty: ${difficulty}
        
        Return ONLY valid JSON:
        {
            "quiz": [
                {
                    "question": "The question text",
                    "type": "mcq" or "true_false",
                    "options": ["A) option", "B) option", "C) option", "D) option"],
                    "correct_answer": "A) option",
                    "explanation": "Why this is the correct answer"
                }
            ]
        }
    `);
    
    // 3. Store quiz
    const quizId = uuidv4();
    await db.query(
        'INSERT INTO quizzes (id, lesson_id, ai_generated_json) VALUES (?, ?, ?)',
        [quizId, lessonId, JSON.stringify(data.quiz)]
    );
    
    return { id: quizId, lesson_id: lessonId, questions: data.quiz };
}

/**
 * Generate a full exam from multiple lessons in a course.
 * @param {string} courseId 
 * @param {object} options 
 * @returns {object} Exam object with questions
 */
async function generateExam(courseId, options = {}) {
    const { questionCount = 20, difficulty = 'mixed' } = options;
    
    // 1. Get all lesson content for the course
    const [lessons] = await db.query(
        'SELECT title, content_text FROM lessons WHERE course_id = ? ORDER BY sequence_order',
        [courseId]
    );
    if (lessons.length === 0) throw new Error('No lessons found for this course');
    
    const allContent = lessons
        .filter(l => l.content_text)
        .map(l => `## ${l.title}\n${l.content_text}`)
        .join('\n\n');
    
    // 2. Generate exam
    const data = await generateJSON(`
        Create a comprehensive ${questionCount}-question exam covering all the following lessons.
        Mix difficulty levels. Include MCQ and True/False questions.
        
        COURSE CONTENT:
        ${allContent}
        
        Return ONLY valid JSON:
        {
            "exam": [
                {
                    "question": "...",
                    "type": "mcq" or "true_false",
                    "options": ["A)", "B)", "C)", "D)"],
                    "correct_answer": "...",
                    "explanation": "...",
                    "source_lesson": "lesson title this question is from"
                }
            ]
        }
    `);
    
    return { course_id: courseId, questions: data.exam };
}

module.exports = {
    generateSummary,
    generateFlashcards,
    generateQuiz,
    generateExam,
};
