const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;