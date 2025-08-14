const express = require('express');
const MessageController = require('../controllers/messageController');

const router = express.Router();

// Lấy danh sách tin nhắn trong chat
router.get('/chats/:chatId/messages', MessageController.getChatMessages);

// Gửi tin nhắn mới
router.post('/chats/:chatId/messages', MessageController.sendMessage);

// Cập nhật tin nhắn
router.put('/messages/:id', MessageController.updateMessage);

// Xóa tin nhắn
router.delete('/messages/:id', MessageController.deleteMessage);

module.exports = router;
