const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db'); // Points to your Aiven connection pool

const register = async (req, res) => {
    const { email, password, first_name, last_name } = req.body;

    try {
        // 1. Check if user already exists
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Generate a UUID and insert into database
        const userId = uuidv4();
        await db.query(
            'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
            [userId, email, password_hash, first_name, last_name]
        );

        // Log the signup
        await db.query(
            'INSERT INTO user_activity_logs (id, user_id, action_type) VALUES (?, ?, ?)',
            [uuidv4(), userId, 'SIGN_UP']
        );

        // 4. Generate JWT Token
        const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: { id: userId, email, first_name, last_name }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find the user
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = users[0];

        // 2. Check the password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // 3. Generate Token with role from DB
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'student' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: { 
                id: user.id, 
                email: user.email, 
                first_name: user.first_name, 
                last_name: user.last_name,
                bio: user.bio,
                headline: user.headline,
                linkedin_url: user.linkedin_url,
                github_url: user.github_url,
                portfolio_url: user.portfolio_url,
                role: user.role || 'student' 
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, first_name, last_name, bio, headline, linkedin_url, github_url, portfolio_url, role, xp, current_streak, longest_streak, total_session_time_seconds, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Server error retrieving user' });
    }
};

const updateProfile = async (req, res) => {
    const { first_name, last_name, bio, headline, linkedin_url, github_url, portfolio_url } = req.body;
    const userId = req.user.id;

    try {
        await db.query(
            'UPDATE users SET first_name = ?, last_name = ?, bio = ?, headline = ?, linkedin_url = ?, github_url = ?, portfolio_url = ? WHERE id = ?',
            [first_name, last_name, bio, headline, linkedin_url, github_url, portfolio_url, userId]
        );

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('updateProfile error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        // 1. Get user with password hash
        const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        // 3. Hash new password
        const salt = await bcrypt.genSalt(10);
        const new_hash = await bcrypt.hash(newPassword, salt);

        // 4. Update
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [new_hash, userId]);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('updatePassword error:', error);
        res.status(500).json({ message: 'Server error updating password' });
    }
};

module.exports = { register, login, getMe, updateProfile, updatePassword };
