const mysql = require('mysql2/promise');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const passwordHash = await bcrypt.hash('password123', 10);
        
        // 1. HIGH RISK STUDENT
        const highRiskId = uuidv4();
        const highRiskLastActive = new Date();
        highRiskLastActive.setDate(highRiskLastActive.getDate() - 40); // 40 days ago

        await db.query('INSERT INTO users (id, email, password_hash, first_name, last_name, last_active_date, total_session_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [highRiskId, 'highrisk_' + Date.now() + '@test.com', passwordHash, 'Struggling', 'Student', highRiskLastActive, 300]);

        // Add bad quiz score
        const courseId = uuidv4();
        const lessonId = uuidv4();
        const quizId = uuidv4();

        await db.query('INSERT INTO courses (id, instructor_id, title) VALUES (?, ?, ?)', [courseId, highRiskId, 'Test Course']);
        await db.query('INSERT INTO lessons (id, course_id, title, video_url, sequence_order) VALUES (?, ?, ?, ?, ?)', [lessonId, courseId, 'Test Lesson', 'http://test.com', 1]);
        await db.query('INSERT INTO quizzes (id, lesson_id, ai_generated_json) VALUES (?, ?, ?)', [quizId, lessonId, '{}']);
        await db.query('INSERT INTO quiz_attempts (id, quiz_id, user_id, score_percentage) VALUES (?, ?, ?, ?)', [uuidv4(), quizId, highRiskId, 25.0]);


        // 2. LOW RISK STUDENT
        const lowRiskId = uuidv4();
        const lowRiskLastActive = new Date(); // Today

        await db.query('INSERT INTO users (id, email, password_hash, first_name, last_name, last_active_date, total_session_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [lowRiskId, 'lowrisk_' + Date.now() + '@test.com', passwordHash, 'Star', 'Student', lowRiskLastActive, 36000]);

        // Add good quiz scores
        await db.query('INSERT INTO quiz_attempts (id, quiz_id, user_id, score_percentage) VALUES (?, ?, ?, ?)', [uuidv4(), quizId, lowRiskId, 98.0]);
        await db.query('INSERT INTO quiz_attempts (id, quiz_id, user_id, score_percentage) VALUES (?, ?, ?, ?)', [uuidv4(), quizId, lowRiskId, 100.0]);

        // Add AI Tutor interactions
        for(let i=0; i<15; i++) {
            await db.query('INSERT INTO ai_chat_logs (id, user_id, lesson_id, user_query, ai_response) VALUES (?, ?, ?, ?, ?)', [uuidv4(), lowRiskId, lessonId, 'Hello', 'Response']);
        }

        console.log('Successfully inserted High Risk and Low Risk test students!');
    } catch (e) {
        console.error(e);
    } finally {
        await db.end();
    }
}
run();
