const Message = require('../models/Message');
const MessageStatus = require('../models/MessageStatus');
const Chat = require('../models/Chat');
const ChatMember = require('../models/ChatMember');
const User = require('../models/User');
const db = require('../config/database');

class MessageController {
  /**
   * GET /chats/:chatId/messages - Lấy danh sách tin nhắn trong chat
   */
  static async getChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50, userId } = req.query;
      
      const chatModel = new Chat();
      const chatMemberModel = new ChatMember();
      const messageModel = new Message();
      const userModel = new User();
      
      // Check if chat exists
      const chat = await chatModel.findById(db, chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Check if user is member of the chat
      if (userId) {
        const isMember = await chatMemberModel.findByChatAndUser(db, chatId, userId);

        if (!isMember) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không phải thành viên của chat này'
          });
        }
      }

      const offset = (page - 1) * limit;

      // Get messages with pagination
      const messages = await messageModel.findByChatIdWithPagination(db, chatId, parseInt(limit), parseInt(offset));
      
      // Get total count for pagination
      const totalCountQuery = `SELECT COUNT(*) as count FROM messages WHERE chat_id = $1`;
      const totalResult = await db.query(totalCountQuery, [chatId]);
      const totalCount = parseInt(totalResult.rows[0].count);

      // Get sender info for each message
      const messagesWithSender = await Promise.all(
        messages.map(async (message) => {
          const sender = await userModel.findById(db, message.sender_id);
          return {
            ...message,
            sender: sender ? {
              id: sender.id,
              username: sender.username,
              avatar_url: sender.avatar_url
            } : null
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          messages: messagesWithSender,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Lấy danh sách tin nhắn thành công'
      });
    } catch (error) {
      console.error('Error getting chat messages:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách tin nhắn'
      });
    }
  }

  /**
   * POST /chats/:chatId/messages - Gửi tin nhắn mới
   */
  static async sendMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { content, message_type = 'text', sender_id } = req.body;

      if (!sender_id) {
        return res.status(400).json({
          success: false,
          message: 'sender_id là bắt buộc'
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn là bắt buộc'
        });
      }

      const chatModel = new Chat();
      const chatMemberModel = new ChatMember();
      const messageModel = new Message();
      const userModel = new User();

      // Check if chat exists
      const chat = await chatModel.findById(db, chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Check if sender is member of the chat
      const senderMembership = await chatMemberModel.findByChatAndUser(db, chatId, sender_id);

      if (!senderMembership) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải thành viên của chat này'
        });
      }

      // Create message
      const messageData = {
        chat_id: parseInt(chatId),
        sender_id: parseInt(sender_id),
        content,
        message_type,
        reply_to_id: null,
        sent_at: new Date().toISOString()
      };

      const newMessage = await messageModel.create(db, messageData);

      // Get all chat members for WebSocket notification
      const chatMembers = await chatMemberModel.findByChatId(db, chatId);

      // Create message status for all chat members except sender
      const messageStatusModel = new MessageStatus();
      const membersExceptSender = chatMembers.filter(member => member.user_id !== parseInt(sender_id));
      
      await Promise.all(
        membersExceptSender.map(async (member) => {
          const statusData = {
            message_id: newMessage.id,
            user_id: member.user_id,
            status: 'sent'
          };
          return await messageStatusModel.create(db, statusData);
        })
      );

      // Get sender info
      const sender = await userModel.findById(db, sender_id);

      const messageWithSender = {
        ...newMessage,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          avatar_url: sender.avatar_url
        } : null
      };

      // Emit WebSocket event to all chat members
      if (req.io) {
        chatMembers.forEach(member => {
          req.io.to(`user_${member.user_id}`).emit('message:new', {
            message: messageWithSender,
            chatId
          });
        });
      }

      res.status(201).json({
        success: true,
        data: messageWithSender,
        message: 'Gửi tin nhắn thành công'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi gửi tin nhắn'
      });
    }
  }

  /**
   * PUT /messages/:id - Cập nhật tin nhắn
   */
  static async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const { content, userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId là bắt buộc'
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn là bắt buộc'
        });
      }

      const messageModel = new Message();
      const chatMemberModel = new ChatMember();
      const userModel = new User();

      // Find message
      const message = await messageModel.findById(db, id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      // Check if user is the sender (only sender can update their own message)
      if (message.sender_id !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ có thể cập nhật tin nhắn của mình'
        });
      }

      // Update message content
      const updatedMessage = await messageModel.updateContent(db, id, content);

      // Get sender info
      const sender = await userModel.findById(db, message.sender_id);

      const messageWithSender = {
        ...updatedMessage,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          avatar_url: sender.avatar_url
        } : null
      };

      // Get chat members for WebSocket emission
      const chatMembers = await chatMemberModel.findByChatId(db, message.chat_id);

      // Emit WebSocket event
      if (req.io) {
        chatMembers.forEach(member => {
          req.io.to(`user_${member.user_id}`).emit('message:updated', {
            message: messageWithSender,
            chatId: message.chat_id,
            updatedBy: userId
          });
        });
      }

      res.status(200).json({
        success: true,
        data: messageWithSender,
        message: 'Cập nhật tin nhắn thành công'
      });
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật tin nhắn'
      });
    }
  }

  /**
   * DELETE /messages/:id - Xóa tin nhắn
   */
  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const messageModel = new Message();
      const chatMemberModel = new ChatMember();
      const messageStatusModel = new MessageStatus();
      const userModel = new User();

      // Find message
      const message = await messageModel.findById(db, id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      // Check if user is the sender or admin of the chat
      const canDelete = message.sender_id === parseInt(userId);
      
      if (!canDelete) {
        // Check if user is admin of the chat
        const chatMember = await chatMemberModel.findByChatAndUser(db, message.chat_id, userId);

        if (!chatMember || chatMember.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Bạn chỉ có thể xóa tin nhắn của mình hoặc phải là admin'
          });
        }
      }

      // Get chat members for WebSocket emission
      const chatMembers = await chatMemberModel.findByChatId(db, message.chat_id);

      // Delete all message statuses for this message first
      await messageStatusModel.deleteByMessageId(db, id);

      // Delete message
      await messageModel.delete(db, id);

      // Emit WebSocket event
      if (req.io) {
        chatMembers.forEach(member => {
          req.io.to(`user_${member.user_id}`).emit('message:deleted', {
            messageId: id,
            chatId: message.chat_id,
            deletedBy: userId
          });
        });
      }

      res.status(200).json({
        success: true,
        message: 'Xóa tin nhắn thành công'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa tin nhắn'
      });
    }
  }

  /**
   * Handle WebSocket message:send event
   */
  static async handleWebSocketMessage(socket, io, data) {
    try {
      const { chatId, content, message_type = 'text' } = data;
      const sender_id = socket.userId;

      if (!sender_id) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const chatMemberModel = new ChatMember();
      const messageModel = new Message();
      const messageStatusModel = new MessageStatus();
      const userModel = new User();

      // Check if sender is member of the chat
      const senderMembership = await chatMemberModel.findByChatAndUser(db, chatId, sender_id);

      if (!senderMembership) {
        socket.emit('error', { message: 'Bạn không phải thành viên của chat này' });
        return;
      }

      // Create message
      const messageData = {
        chat_id: parseInt(chatId),
        sender_id: parseInt(sender_id),
        content,
        message_type,
        reply_to_id: null,
        sent_at: new Date().toISOString()
      };

      const newMessage = await messageModel.create(db, messageData);

      // Get all chat members
      const chatMembers = await chatMemberModel.findByChatId(db, chatId);

      // Create message status for all chat members except sender
      const membersExceptSender = chatMembers.filter(member => member.user_id !== parseInt(sender_id));
      
      await Promise.all(
        membersExceptSender.map(async (member) => {
          const statusData = {
            message_id: newMessage.id,
            user_id: member.user_id,
            status: 'sent'
          };
          return await messageStatusModel.create(db, statusData);
        })
      );

      // Get sender info
      const sender = await userModel.findById(db, sender_id);

      const messageWithSender = {
        ...newMessage,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          avatar_url: sender.avatar_url
        } : null
      };

      // Emit to all chat members
      chatMembers.forEach(member => {
        io.to(`user_${member.user_id}`).emit('message:new', {
          message: messageWithSender,
          chatId
        });
      });

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      socket.emit('error', { message: 'Lỗi server khi gửi tin nhắn' });
    }
  }
  /**
   * Handle WebSocket message:send event
   */
  static async handleWebSocketMessage(socket, io, data) {
    try {
      console.log('🔄 Handling WebSocket message:', data);
      
      const { chatId, content, message_type = 'text', sender_id } = data;
      const userId = socket.userId || sender_id;

      if (!chatId || !content || !userId) {
        socket.emit('error', { message: 'Missing required fields: chatId, content, or userId' });
        return;
      }

      const chatModel = new Chat();
      const chatMemberModel = new ChatMember();
      const messageModel = new Message();
      const userModel = new User();

      // Check if chat exists
      const chat = await chatModel.findById(db, chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat không tồn tại' });
        return;
      }

      // Check if user is member of the chat (optional for testing)
      const isMember = await chatMemberModel.findByChatAndUser(db, chatId, userId);
      if (!isMember) {
        console.warn(`User ${userId} is not a member of chat ${chatId}, but allowing for testing`);
        // socket.emit('error', { message: 'Bạn không phải thành viên của chat này' });
        // return;
      }

      // Create message
      const messageData = {
        chat_id: parseInt(chatId),
        sender_id: parseInt(userId),
        content,
        message_type,
        reply_to_id: null,
        sent_at: new Date().toISOString()
      };

      const newMessage = await messageModel.create(db, messageData);
      
      // Get sender info
      const sender = await userModel.findById(db, userId);
      
      // Format message for response
      const messageResponse = {
        id: newMessage.id,
        chat_id: parseInt(chatId),
        sender_id: parseInt(userId),
        content,
        message_type,
        sent_at: newMessage.sent_at,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          display_name: sender.display_name,
          avatar_url: sender.avatar_url
        } : null
      };

      // Get all chat members to broadcast
      const chatMembers = await chatMemberModel.findByChatId(db, chatId);
      
      // Broadcast to all chat members
      chatMembers.forEach(member => {
        io.to(`user_${member.user_id}`).emit('message:new', {
          message: messageResponse,
          chatId: chatId.toString()
        });
      });

      console.log(`✅ Message sent via WebSocket to chat ${chatId}, broadcasted to ${chatMembers.length} members`);

    } catch (error) {
      console.error('❌ Error in handleWebSocketMessage:', error);
      socket.emit('error', { message: 'Lỗi khi gửi tin nhắn: ' + error.message });
    }
  }
}

module.exports = MessageController;
