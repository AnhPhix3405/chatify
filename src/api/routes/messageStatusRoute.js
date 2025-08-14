const express = require('express');
const MessageStatusController = require('../controllers/messageStatusController');

const router = express.Router();

// Cập nhật trạng thái tin nhắn
router.put('/messages/:id/status', MessageStatusController.updateMessageStatus);

// Lấy trạng thái tin nhắn
router.get('/messages/:id/status', MessageStatusController.getMessageStatus);

// Đánh dấu tất cả tin nhắn trong chat đã đọc
router.put('/chats/:chatId/messages/read', MessageStatusController.markChatMessagesAsRead);

module.exports = router;
