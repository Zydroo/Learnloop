require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for large transcripts

// ============================================
// Route Imports
// ============================================
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes'); // NEW: Behavioral Analytics

// ============================================
// Route Mounts
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tracking', analyticsRoutes); // RENAMED from /analytics to bypass ad-blockers
app.use('/api/adaptive', require('./routes/adaptiveRoutes')); // NEW: Adaptive Learning
app.use('/api/reviews', require('./routes/reviewRoutes')); // NEW: Social Reviews & Ratings
app.use('/api/comments', require('./routes/commentRoutes')); // NEW: Lesson Discussions
app.use('/api/gamification', require('./routes/gamificationRoutes')); // NEW: Leaderboard & Badges
app.use('/api/certificates', require('./routes/certificateRoutes')); // NEW: Certification System
app.use('/api/skills', require('./routes/skillRoutes')); // NEW: AI Skill Verification
app.use('/api/recommendations', require('./routes/recommendationRoutes')); // NEW: Personalized Onboarding

// ============================================
// Health Check
// ============================================
app.get('/', (req, res) => {
    res.json({ message: 'LearnLoop API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
