const Message = require('../models/Message');
const MessageStatus = require('../models/MessageStatus');
const Chat = require('../models/Chat');
const ChatMember = require('../models/ChatMember');
const User = require('../models/User');

class MessageController {
  /**
   * GET /chats/:chatId/messages - Lấy danh sách tin nhắn trong chat
   */
  static async getChatMessages(req, res) {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50, userId } = req.query;
      
      // Check if chat exists
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Check if user is member of the chat
      if (userId) {
        const isMember = await ChatMember.findOne({
          where: { chatId, userId }
        });

        if (!isMember) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không phải thành viên của chat này'
          });
        }
      }

      const offset = (page - 1) * limit;

      const messages = await Message.findAndCountAll({
        where: { chatId },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: MessageStatus,
            as: 'statuses',
            include: [
              {
                model: User,
                attributes: ['id', 'username']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          messages: messages.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: messages.count,
            totalPages: Math.ceil(messages.count / limit)
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
      const { content, messageType = 'text', senderId, fileUrl, fileName, fileSize } = req.body;

      if (!senderId) {
        return res.status(400).json({
          success: false,
          message: 'SenderId là bắt buộc'
        });
      }

      if (!content && !fileUrl) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn hoặc file là bắt buộc'
        });
      }

      // Check if chat exists
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Check if sender is member of the chat
      const senderMembership = await ChatMember.findOne({
        where: { chatId, userId: senderId }
      });

      if (!senderMembership) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải thành viên của chat này'
        });
      }

      // Create message
      const newMessage = await Message.create({
        chatId,
        senderId,
        content,
        messageType,
        fileUrl,
        fileName,
        fileSize
      });

      // Get all chat members except sender
      const chatMembers = await ChatMember.findAll({
        where: { 
          chatId,
          userId: { $ne: senderId }
        },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'isOnline']
          }
        ]
      });

      // Create message status for each recipient
      const messageStatuses = await Promise.all(
        chatMembers.map(member =>
          MessageStatus.create({
            messageId: newMessage.id,
            userId: member.userId,
            status: 'sent'
          })
        )
      );

      // Get complete message with sender info and statuses
      const messageWithDetails = await Message.findByPk(newMessage.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: MessageStatus,
            as: 'statuses',
            include: [
              {
                model: User,
                attributes: ['id', 'username']
              }
            ]
          }
        ]
      });

      // Emit WebSocket event to all chat members
      if (req.io) {
        // Emit to all members (including sender for confirmation)
        const allMembers = [...chatMembers, { userId: senderId }];
        
        allMembers.forEach(member => {
          req.io.to(`user_${member.userId}`).emit('message:new', {
            message: messageWithDetails,
            chatId
          });
        });
      }

      res.status(201).json({
        success: true,
        data: messageWithDetails,
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
   * DELETE /messages/:id - Xóa tin nhắn
   */
  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      // Find message
      const message = await Message.findByPk(id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username']
          }
        ]
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      // Check if user is the sender or admin of the chat
      const canDelete = message.senderId === userId;
      
      if (!canDelete) {
        // Check if user is admin of the chat
        const chatMember = await ChatMember.findOne({
          where: { 
            chatId: message.chatId, 
            userId,
            role: 'admin'
          }
        });

        if (!chatMember) {
          return res.status(403).json({
            success: false,
            message: 'Bạn chỉ có thể xóa tin nhắn của mình hoặc phải là admin'
          });
        }
      }

      // Get chat members for WebSocket emission
      const chatMembers = await ChatMember.findAll({
        where: { chatId: message.chatId },
        attributes: ['userId']
      });

      // Delete message (cascade will delete message statuses)
      await message.destroy();

      // Emit WebSocket event
      if (req.io) {
        chatMembers.forEach(member => {
          req.io.to(`user_${member.userId}`).emit('message:deleted', {
            messageId: id,
            chatId: message.chatId,
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
      const { chatId, content, messageType = 'text', fileUrl, fileName, fileSize } = data;
      const senderId = socket.userId;

      if (!senderId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Check if sender is member of the chat
      const senderMembership = await ChatMember.findOne({
        where: { chatId, userId: senderId }
      });

      if (!senderMembership) {
        socket.emit('error', { message: 'Bạn không phải thành viên của chat này' });
        return;
      }

      // Create message
      const newMessage = await Message.create({
        chatId,
        senderId,
        content,
        messageType,
        fileUrl,
        fileName,
        fileSize
      });

      // Get all chat members except sender
      const chatMembers = await ChatMember.findAll({
        where: { 
          chatId,
          userId: { $ne: senderId }
        }
      });

      // Create message status for each recipient
      await Promise.all(
        chatMembers.map(member =>
          MessageStatus.create({
            messageId: newMessage.id,
            userId: member.userId,
            status: 'sent'
          })
        )
      );

      // Get complete message with sender info and statuses
      const messageWithDetails = await Message.findByPk(newMessage.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'avatar']
          },
          {
            model: MessageStatus,
            as: 'statuses',
            include: [
              {
                model: User,
                attributes: ['id', 'username']
              }
            ]
          }
        ]
      });

      // Emit to all chat members
      const allMembers = [...chatMembers, { userId: senderId }];
      
      allMembers.forEach(member => {
        io.to(`user_${member.userId}`).emit('message:new', {
          message: messageWithDetails,
          chatId
        });
      });

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      socket.emit('error', { message: 'Lỗi server khi gửi tin nhắn' });
    }
  }
}

module.exports = MessageController;
