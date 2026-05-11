const express = require('express');
const router = express.Router();
const { getMyCertificates, issueCertificate, verifyCertificate } = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');

// Get user's certificates
router.get('/', authMiddleware, getMyCertificates);

// Issue a new certificate
router.post('/issue/:courseId', authMiddleware, issueCertificate);

// Verify a certificate (Public)
router.get('/verify/:code', verifyCertificate);

module.exports = router;
