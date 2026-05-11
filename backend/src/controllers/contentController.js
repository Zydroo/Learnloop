const db = require('../db');
const { generateSummary, generateFlashcards, generateQuiz, generateExam } = require('../services/contentGenerator');
const { processLesson } = require('../services/embeddingService');

/**
 * ============================================================
 * CONTENT CONTROLLER
 * ============================================================
 * Handles generation and retrieval of AI-generated educational
 * content: summaries, flashcards, quizzes, and exams.
 * ============================================================
 */

/**
 * @desc    Generate or retrieve a lesson summary
 * @route   POST /api/content/:lessonId/summary
 */
const getSummary = async (req, res) => {
    try {
        const summary = await generateSummary(req.params.lessonId);
        res.json(summary);
    } catch (error) {
        console.error('Summary error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Generate or retrieve flashcards for a lesson
 * @route   POST /api/content/:lessonId/flashcards
 */
const getFlashcards = async (req, res) => {
    try {
        const count = req.body?.count || 10;
        const flashcards = await generateFlashcards(req.params.lessonId, count);
        res.json(flashcards);
    } catch (error) {
        console.error('Flashcard error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Generate a quiz for a lesson
 * @route   POST /api/content/:lessonId/quiz
 */
const getQuiz = async (req, res) => {
    try {
        const options = {
            questionCount: req.body?.questionCount || 5,
            difficulty: req.body?.difficulty || 'mixed',
            type: req.body?.type || 'mcq'
        };
        const quiz = await generateQuiz(req.params.lessonId, options);
        res.json(quiz);
    } catch (error) {
        console.error('Quiz error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Submit a quiz attempt
 * @route   POST /api/content/quiz-attempt
 */
const submitQuiz = async (req, res) => {
    const { quiz_id, score_percentage } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const gamification = require('../services/gamificationService');

    try {
        await db.query(
            'INSERT INTO quiz_attempts (id, quiz_id, user_id, score_percentage) VALUES (?, ?, ?, ?)',
            [uuidv4(), quiz_id, req.user.id, score_percentage]
        );

        // Award XP: Base for completion + Bonus for high score
        let xpAwarded = 10; // Base completion XP
        if (score_percentage >= 70) {
            xpAwarded += gamification.XP_ACTIONS.COMPLETE_QUIZ; // Bonus (50 XP)
        }
        
        await gamification.awardXP(req.user.id, xpAwarded);

        // Log the activity
        await db.query(
            'INSERT INTO user_activity_logs (id, user_id, action_type, target_id) VALUES (?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'SUBMIT_QUIZ', quiz_id]
        );

        res.json({ message: 'Quiz attempt saved.' });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ message: 'Failed to save quiz attempt.' });
    }
};

/**
 * @desc    Generate an exam for an entire course
 * @route   POST /api/content/course/:courseId/exam
 */
const getExam = async (req, res) => {
    try {
        const options = {
            questionCount: req.body?.questionCount || 20,
            difficulty: req.body?.difficulty || 'mixed'
        };
        const exam = await generateExam(req.params.courseId, options);
        res.json(exam);
    } catch (error) {
        console.error('Exam error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Trigger embedding processing for a lesson
 * @route   POST /api/content/:lessonId/embed
 */
const embedLesson = async (req, res) => {
    try {
        await processLesson(req.params.lessonId);
        res.json({ message: 'Lesson embedded successfully!' });
    } catch (error) {
        console.error('Embedding error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all stored flashcards for a lesson
 * @route   GET /api/content/:lessonId/flashcards
 */
const getStoredFlashcards = async (req, res) => {
    try {
        const [flashcards] = await db.query(
            'SELECT * FROM flashcards WHERE lesson_id = ? ORDER BY difficulty ASC',
            [req.params.lessonId]
        );
        res.json(flashcards);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch flashcards.' });
    }
};

/**
 * @desc    Get stored summary for a lesson
 * @route   GET /api/content/:lessonId/summary
 */
const getStoredSummary = async (req, res) => {
    try {
        const [summaries] = await db.query(
            'SELECT * FROM lesson_summaries WHERE lesson_id = ?',
            [req.params.lessonId]
        );
        if (summaries.length === 0) {
            return res.status(404).json({ message: 'No summary found. Generate one first.' });
        }
        res.json(summaries[0]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch summary.' });
    }
};

module.exports = { 
    getSummary, 
    getFlashcards, 
    getQuiz, 
    getExam, 
    embedLesson,
    getStoredFlashcards,
    getStoredSummary,
    submitQuiz
};
