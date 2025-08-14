const express = require('express');
const ChatController = require('../controllers/chatController');

const router = express.Router();

// Lấy danh sách chat của 1 user
router.get('/chats', ChatController.getUserChats);

// Lấy thông tin 1 chat cụ thể
router.get('/chats/:id', ChatController.getChatById);

// Tạo chat mới (1-1 hoặc group)
router.post('/chats', ChatController.createChat);

// Cập nhật thông tin chat
router.put('/chats/:id', ChatController.updateChat);

// Xóa chat
router.delete('/chats/:id', ChatController.deleteChat);

module.exports = router;
