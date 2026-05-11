-- Phase 2 Gamification and Analytics Migrations
-- Safe to run, adds new columns and tables

-- 1. Alter 'users' table to add Gamification fields
ALTER TABLE users 
ADD COLUMN xp INT DEFAULT 0,
ADD COLUMN current_streak INT DEFAULT 0,
ADD COLUMN longest_streak INT DEFAULT 0,
ADD COLUMN last_active_date DATE,
ADD COLUMN total_session_time_seconds INT DEFAULT 0;

-- 2. Add 'metadata' column to 'user_activity_logs' to track JSON event data
ALTER TABLE user_activity_logs 
ADD COLUMN metadata JSON DEFAULT NULL;

-- 3. Create 'study_sessions' table for global session tracking
CREATE TABLE IF NOT EXISTS study_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Create Gamification Tables
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    required_xp INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_id VARCHAR(36) NOT NULL,
    badge_id VARCHAR(36) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);
