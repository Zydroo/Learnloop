const express = require('express');
const router = express.Router();
const { 
    getSummary, getFlashcards, getQuiz, getExam, 
    embedLesson, getStoredFlashcards, getStoredSummary 
} = require('../controllers/contentController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Lesson Content Generation (Protected) ---

// Generate summary for a lesson
router.post('/:lessonId/summary', authMiddleware, getSummary);

// Generate flashcards for a lesson
router.post('/:lessonId/flashcards', authMiddleware, getFlashcards);

// Generate quiz for a lesson
router.post('/:lessonId/quiz', authMiddleware, getQuiz);

// Generate exam for an entire course
router.post('/course/:courseId/exam', authMiddleware, getExam);

// Trigger embedding processing for a lesson
router.post('/:lessonId/embed', authMiddleware, embedLesson);

// Submit quiz attempt
router.post('/quiz-attempt', authMiddleware, require('../controllers/contentController').submitQuiz);

// --- Retrieve Stored Content ---

// Get stored summary
router.get('/:lessonId/summary', authMiddleware, getStoredSummary);

// Get stored flashcards
router.get('/:lessonId/flashcards', authMiddleware, getStoredFlashcards);

module.exports = router;
