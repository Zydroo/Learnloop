const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * ============================================================
 * BULK COURSE SEEDER
 * ============================================================
 * Use this to add multiple courses at once.
 * ============================================================
 */

const INSTRUCTOR_ID = 'ceddf7a2-2261-4abb-b61b-03def5552a58'; // Your account ID

const coursesToSeed = [
    {
        title: "Mastering Python: From Zero to Hero",
        description: "Learn Python programming from scratch. Covers basics, OOP, and data science libraries.",
        price: 49.99,
        thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1000",
        lessons: [
            { title: "Introduction to Python", url: "https://www.youtube.com/watch?v=rfscVS0vtbw" },
            { title: "Data Types and Variables", url: "https://www.youtube.com/watch?v=Z1Yd7upQsXY" },
            { title: "Control Flow (If/Else, Loops)", url: "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ" }
        ]
    },
    {
        title: "Modern UI/UX Design Fundamentals",
        description: "Design beautiful interfaces and great user experiences using Figma and modern principles.",
        price: 29.99,
        thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?auto=format&fit=crop&q=80&w=1000",
        lessons: [
            { title: "What is UI vs UX?", url: "https://www.youtube.com/watch?v=zHAa-m16p30" },
            { title: "Figma for Beginners", url: "https://www.youtube.com/watch?v=FTFaQWZBqQ8" },
            { title: "Design Systems and Components", url: "https://www.youtube.com/watch?v=3q3m_v5Xj8A" }
        ]
    },
    {
        title: "Full-Stack Web Development with Next.js",
        description: "Build production-ready applications with Next.js 14, Tailwind CSS, and Prisma.",
        price: 99.99,
        thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=1000",
        lessons: [
            { title: "Next.js App Router Setup", url: "https://www.youtube.com/watch?v=wm5gMKuwSYk" },
            { title: "Server Components & Data Fetching", url: "https://www.youtube.com/watch?v=680X_S0E858" },
            { title: "Authentication with NextAuth", url: "https://www.youtube.com/watch?v=w2h54hz6mUM" }
        ]
    }
];

async function seed() {
    console.log("🌱 Starting Bulk Course Import...");
    
    try {
        for (const courseData of coursesToSeed) {
            const courseId = uuidv4();
            
            // 1. Insert Course
            await db.query(
                'INSERT INTO courses (id, instructor_id, title, description, price, thumbnail_url, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [courseId, INSTRUCTOR_ID, courseData.title, courseData.description, courseData.price, courseData.thumbnail, 1]
            );
            
            console.log(`✅ Created Course: ${courseData.title}`);

            // 2. Insert Lessons
            for (let i = 0; i < courseData.lessons.length; i++) {
                const lessonId = uuidv4();
                await db.query(
                    'INSERT INTO lessons (id, course_id, title, video_url, sequence_order) VALUES (?, ?, ?, ?, ?)',
                    [lessonId, courseId, courseData.lessons[i].title, courseData.lessons[i].url, i + 1]
                );
            }
            console.log(`   - Added ${courseData.lessons.length} lessons.`);
        }
        
        console.log("\n✨ Bulk Import Successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error.message);
        process.exit(1);
    }
}

seed();
