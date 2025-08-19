const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// POST /auth/login - User login
router.post('/auth/login', AuthController.login);

module.exports = router;