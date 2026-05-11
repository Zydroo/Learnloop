const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * Gamification Service
 * Handles XP rewards, daily streaks, and badges.
 */

// Define standard XP rewards
const XP_ACTIONS = {
    WATCH_LESSON: 10,
    COMPLETE_QUIZ: 50,
    ASK_AI: 5,
    DAILY_LOGIN: 20,
    WATCH_TIME_10M: 15 // Every 10 mins of watch time
};

/**
 * Calculate level based on total XP
 * Formula: Level = Floor(sqrt(XP / 50)) + 1
 * Level 1: 0 XP
 * Level 2: 50 XP
 * Level 3: 200 XP
 * Level 4: 450 XP
 */
const calculateLevel = (xp) => {
    return Math.floor(Math.sqrt(xp / 50)) + 1;
};

/**
 * Get effective streak for display.
 * Returns 0 if the user hasn't been active since before yesterday.
 */
const getEffectiveStreak = (user) => {
    if (!user.last_active_date) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const lastActive = new Date(user.last_active_date).toISOString().split('T')[0];
    
    if (lastActive === today) return user.current_streak;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastActive === yesterdayStr) return user.current_streak;
    
    // Streak broken/expired
    return 0;
};


/**
 * Award XP to a user and check for streaks.
 */
const awardXP = async (userId, amount) => {
    try {
        await db.query(
            'UPDATE users SET xp = xp + ? WHERE id = ?',
            [amount, userId]
        );
        console.log(`[GAMIFICATION] Awarded ${amount} XP to user ${userId}`);
    } catch (err) {
        console.error('Error awarding XP:', err);
    }
};

/**
 * Update user's daily streak. Call this on first action of the day or session start.
 * @param {string} userId - UUID
 */
const updateStreak = async (userId) => {
    try {
        const [rows] = await db.query('SELECT last_active_date, current_streak, longest_streak FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return;

        const user = rows[0];
        const today = new Date().toISOString().split('T')[0];
        const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;

        if (lastActive === today) {
            // Already updated today
            return;
        }

        let newStreak = user.current_streak;
        
        if (!lastActive) {
            // First time ever
            newStreak = 1;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
                // Maintained streak
                newStreak += 1;
            } else {
                // Streak broken
                newStreak = 1;
            }
        }

        const longest = Math.max(newStreak, user.longest_streak || 0);

        await db.query(
            'UPDATE users SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?',
            [newStreak, longest, today, userId]
        );

        if (lastActive !== today) {
            // Award daily login XP
            await awardXP(userId, XP_ACTIONS.DAILY_LOGIN);
        }

    } catch (err) {
        console.error('Error updating streak:', err);
    }
};

module.exports = {
    awardXP,
    updateStreak,
    getEffectiveStreak,
    calculateLevel,
    XP_ACTIONS
};
