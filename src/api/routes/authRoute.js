const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// POST /auth/login - Đăng nhập
router.post('/login', AuthController.login);

// POST /auth/register - Đăng ký
router.post('/register', AuthController.register);

// POST /auth/logout - Đăng xuất
router.post('/logout', AuthController.logout);

// GET /auth/me - Lấy thông tin user hiện tại
router.get('/me', AuthController.getCurrentUser);

module.exports = router;
