-- ========================================================
-- MIGRATION 001: AI Content Tables
-- LearnLoop V2 — Phase 1
-- ========================================================

-- Lesson content chunks for RAG (Retrieval-Augmented Generation)
-- We split lesson text into smaller pieces so the AI can find
-- the most relevant section instead of sending everything.
CREATE TABLE IF NOT EXISTS lesson_chunks (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INT NOT NULL,
    embedding JSON,
    token_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    INDEX idx_lesson_chunks_lesson (lesson_id)
);

-- AI-generated lesson summaries
CREATE TABLE IF NOT EXISTS lesson_summaries (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL UNIQUE,
    summary_text TEXT NOT NULL,
    key_points JSON,
    difficulty_level ENUM('beginner','intermediate','advanced') DEFAULT 'intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- AI-generated flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    difficulty INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    INDEX idx_flashcards_lesson (lesson_id)
);

-- Video transcripts with timestamps (for AI Video Search)
CREATE TABLE IF NOT EXISTS lesson_transcripts (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL UNIQUE,
    full_transcript TEXT,
    timestamped_segments JSON,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- AI conversation sessions (upgrade from flat ai_chat_logs)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36),
    lesson_id VARCHAR(36),
    title VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    INDEX idx_conv_user (user_id)
);

-- Individual messages within a conversation
CREATE TABLE IF NOT EXISTS ai_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    role ENUM('user','assistant','system') NOT NULL,
    content TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
    INDEX idx_messages_conv (conversation_id)
);
