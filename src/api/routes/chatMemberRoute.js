const express = require('express');
const ChatMemberController = require('../controllers/chatMemberController');

const router = express.Router();

// Lấy danh sách thành viên
router.get('/chats/:chatId/members', ChatMemberController.getChatMembers);

// Thêm thành viên vào chat
router.post('/chats/:chatId/members', ChatMemberController.addChatMember);

// Xóa thành viên khỏi chat
router.delete('/chats/:chatId/members/:userId', ChatMemberController.removeChatMember);

// Cập nhật role của thành viên
router.put('/chats/:chatId/members/:userId/role', ChatMemberController.updateMemberRole);

module.exports = router;
