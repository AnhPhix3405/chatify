const express = require('express');
const ChatController = require('../controllers/chatController');

const router = express.Router();

// Lấy danh sách chat của 1 user
router.get('/chats', ChatController.getUserChats);

// Lấy danh sách chat của user với tin nhắn cuối cùng
router.get('/chats/user/:userId/with-last-messages', ChatController.getUserChatsWithLastMessages);

// Lấy tin nhắn cuối cùng của 1 chat
router.get('/chats/:chatId/last-message', ChatController.getLastMessage);

// Lấy thông tin 1 chat cụ thể
router.get('/chats/:id', ChatController.getChatById);

// Tạo chat mới (1-1 hoặc group)
router.post('/chats', ChatController.createChat);

// Cập nhật thông tin chat
router.put('/chats/:id', ChatController.updateChat);

// Xóa chat
router.delete('/chats/:id', ChatController.deleteChat);

module.exports = router;
