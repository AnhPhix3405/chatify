const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

// Lấy danh sách tất cả user
router.get('/users', UserController.getAllUsers);

// Lấy thông tin 1 user
router.get('/users/:id', UserController.getUserById);

// Tạo user mới
router.post('/users', UserController.createUser);

// Cập nhật thông tin user
router.put('/users/:id', UserController.updateUser);

// Xóa user
router.delete('/users/:id', UserController.deleteUser);

// Tìm kiếm user theo username
router.get('/users/search/:username', UserController.searchUserByUsername);

module.exports = router;
