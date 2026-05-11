const db = require('../db');
const gamification = require('../services/gamificationService');


/**
 * @desc    Get top students by XP (Leaderboard)
 * @route   GET /api/gamification/leaderboard
 * @access  Private
 */
const getLeaderboard = async (req, res) => {
    try {
        const [topStudents] = await db.query(`
            SELECT id, first_name, last_name, xp, current_streak, last_active_date
            FROM users
            WHERE email NOT LIKE '%admin%'
            ORDER BY xp DESC
            LIMIT 50
        `);


        res.status(200).json(topStudents.map((s, i) => ({
            rank: i + 1,
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            xp: s.xp,
            streak: gamification.getEffectiveStreak(s)
        })));

    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
};

/**
 * @desc    Get user's earned badges
 * @route   GET /api/gamification/my-badges
 * @access  Private
 */
const getMyBadges = async (req, res) => {
    const userId = req.user.id;

    try {
        const [badges] = await db.query(`
            SELECT b.*, ub.earned_at
            FROM badges b
            JOIN user_badges ub ON b.id = ub.badge_id
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        `, [userId]);

        res.status(200).json(badges);
    } catch (error) {
        console.error('Badges error:', error);
        res.status(500).json({ message: 'Error fetching badges' });
    }
};

/**
 * @desc    Get current user's global rank and percentile
 * @route   GET /api/gamification/my-rank
 * @access  Private
 */
const getUserRank = async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. Get total students (non-admins)
        const [totalRes] = await db.query("SELECT COUNT(*) as total FROM users WHERE email NOT LIKE '%admin%'");
        const totalStudents = totalRes[0].total;

        // 2. Get user's XP
        const [userRes] = await db.query("SELECT xp FROM users WHERE id = ?", [userId]);
        if (userRes.length === 0) return res.status(404).json({ message: 'User not found' });
        const userXP = userRes[0].xp || 0;

        // 3. Calculate rank (number of students with more XP + 1)
        const [rankRes] = await db.query("SELECT COUNT(*) + 1 as rank FROM users WHERE xp > ? AND email NOT LIKE '%admin%'", [userXP]);
        const rank = rankRes[0].rank;

        // 4. Calculate percentile
        // Percentile = (Number of people ranked below you / Total number of people) * 100
        const percentile = totalStudents > 0 ? ((totalStudents - rank + 1) / totalStudents) * 100 : 0;

        res.status(200).json({
            rank,
            totalStudents,
            percentile: Math.round(percentile),
            isTopPercent: percentile >= 90
        });
    } catch (error) {
        console.error('Rank error:', error);
        res.status(500).json({ message: 'Error fetching rank' });
    }
};

module.exports = {
    getLeaderboard,
    getMyBadges,
    getUserRank
};
