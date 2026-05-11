const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updatePassword } = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', authMiddleware, getMe);

// PATCH /api/auth/update-profile
router.patch('/update-profile', authMiddleware, updateProfile);

// PATCH /api/auth/update-password
router.patch('/update-password', authMiddleware, updatePassword);

module.exports = router;
