const express = require('express');
const router = express.Router();
const { getMySkillMap } = require('../controllers/skillController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/my-map', authMiddleware, getMySkillMap);

module.exports = router;
