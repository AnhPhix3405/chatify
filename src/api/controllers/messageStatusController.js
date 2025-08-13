const MessageStatus = require('../models/MessageStatus');
const Message = require('../models/Message');
const ChatMember = require('../models/ChatMember');
const User = require('../models/User');

class MessageStatusController {
  /**
   * PUT /messages/:id/status - Cập nhật trạng thái tin nhắn
   */
  static async updateMessageStatus(req, res) {
    try {
      const { id } = req.params; // messageId
      const { status, userId } = req.body;

      if (!['delivered', 'read'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ. Chỉ chấp nhận "delivered" hoặc "read"'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'UserId là bắt buộc'
        });
      }

      // Check if message exists
      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      // Check if user is member of the chat
      const isMember = await ChatMember.findOne({
        where: { 
          chatId: message.chatId, 
          userId 
        }
      });

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải thành viên của chat này'
        });
      }

      // Find or create message status
      let messageStatus = await MessageStatus.findOne({
        where: { 
          messageId: id, 
          userId 
        }
      });

      if (!messageStatus) {
        // Create new status if doesn't exist (shouldn't happen normally)
        messageStatus = await MessageStatus.create({
          messageId: id,
          userId,
          status
        });
      } else {
        // Update existing status
        // Only allow progression: sent -> delivered -> read
        const statusProgression = {
          'sent': ['delivered', 'read'],
          'delivered': ['read'],
          'read': []
        };

        if (!statusProgression[messageStatus.status].includes(status) && messageStatus.status !== status) {
          return res.status(400).json({
            success: false,
            message: 'Không thể cập nhật trạng thái ngược lại'
          });
        }

        await messageStatus.update({ 
          status,
          [status === 'delivered' ? 'deliveredAt' : 'readAt']: new Date()
        });
      }

      // Get updated message status with user info
      const updatedStatus = await MessageStatus.findOne({
        where: { 
          messageId: id, 
          userId 
        },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar']
          }
        ]
      });

      // Get all chat members for WebSocket emission
      const chatMembers = await ChatMember.findAll({
        where: { chatId: message.chatId },
        attributes: ['userId']
      });

      // Emit WebSocket event to all chat members
      if (req.io) {
        chatMembers.forEach(member => {
          req.io.to(`user_${member.userId}`).emit('message:statusUpdated', {
            messageId: id,
            chatId: message.chatId,
            status: updatedStatus,
            updatedBy: userId
          });
        });
      }

      res.status(200).json({
        success: true,
        data: updatedStatus,
        message: 'Cập nhật trạng thái tin nhắn thành công'
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật trạng thái tin nhắn'
      });
    }
  }

  /**
   * GET /messages/:id/status - Lấy trạng thái tin nhắn
   */
  static async getMessageStatus(req, res) {
    try {
      const { id } = req.params; // messageId

      // Check if message exists
      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      const statuses = await MessageStatus.findAll({
        where: { messageId: id },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: statuses,
        message: 'Lấy trạng thái tin nhắn thành công'
      });
    } catch (error) {
      console.error('Error getting message status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy trạng thái tin nhắn'
      });
    }
  }

  /**
   * Handle WebSocket message:delivered event
   */
  static async handleMessageDelivered(socket, io, data) {
    try {
      const { messageId } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Find message status
      const messageStatus = await MessageStatus.findOne({
        where: { 
          messageId, 
          userId 
        }
      });

      if (!messageStatus) {
        socket.emit('error', { message: 'Không tìm thấy trạng thái tin nhắn' });
        return;
      }

      // Update to delivered if currently sent
      if (messageStatus.status === 'sent') {
        await messageStatus.update({ 
          status: 'delivered',
          deliveredAt: new Date()
        });

        // Get message for chat info
        const message = await Message.findByPk(messageId);
        
        // Get all chat members for emission
        const chatMembers = await ChatMember.findAll({
          where: { chatId: message.chatId },
          attributes: ['userId']
        });

        // Get updated status with user info
        const updatedStatus = await MessageStatus.findOne({
          where: { messageId, userId },
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'avatar']
            }
          ]
        });

        // Emit to all chat members
        chatMembers.forEach(member => {
          io.to(`user_${member.userId}`).emit('message:statusUpdated', {
            messageId,
            chatId: message.chatId,
            status: updatedStatus,
            updatedBy: userId
          });
        });
      }

    } catch (error) {
      console.error('Error handling message delivered:', error);
      socket.emit('error', { message: 'Lỗi server khi cập nhật trạng thái delivered' });
    }
  }

  /**
   * Handle WebSocket message:read event
   */
  static async handleMessageRead(socket, io, data) {
    try {
      const { messageId } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Find message status
      const messageStatus = await MessageStatus.findOne({
        where: { 
          messageId, 
          userId 
        }
      });

      if (!messageStatus) {
        socket.emit('error', { message: 'Không tìm thấy trạng thái tin nhắn' });
        return;
      }

      // Update to read (from any previous status)
      await messageStatus.update({ 
        status: 'read',
        readAt: new Date(),
        // Also set deliveredAt if it wasn't set before
        ...(!messageStatus.deliveredAt && { deliveredAt: new Date() })
      });

      // Get message for chat info
      const message = await Message.findByPk(messageId);
      
      // Get all chat members for emission
      const chatMembers = await ChatMember.findAll({
        where: { chatId: message.chatId },
        attributes: ['userId']
      });

      // Get updated status with user info
      const updatedStatus = await MessageStatus.findOne({
        where: { messageId, userId },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar']
          }
        ]
      });

      // Emit to all chat members
      chatMembers.forEach(member => {
        io.to(`user_${member.userId}`).emit('message:statusUpdated', {
          messageId,
          chatId: message.chatId,
          status: updatedStatus,
          updatedBy: userId
        });
      });

    } catch (error) {
      console.error('Error handling message read:', error);
      socket.emit('error', { message: 'Lỗi server khi cập nhật trạng thái read' });
    }
  }

  /**
   * Mark multiple messages as read (for when user opens a chat)
   */
  static async markChatMessagesAsRead(req, res) {
    try {
      const { chatId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'UserId là bắt buộc'
        });
      }

      // Check if user is member of the chat
      const isMember = await ChatMember.findOne({
        where: { 
          chatId, 
          userId 
        }
      });

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải thành viên của chat này'
        });
      }

      // Get all unread messages in this chat for this user
      const unreadStatuses = await MessageStatus.findAll({
        where: { 
          userId,
          status: { $in: ['sent', 'delivered'] }
        },
        include: [
          {
            model: Message,
            where: { chatId }
          }
        ]
      });

      // Update all to read
      const updatePromises = unreadStatuses.map(status =>
        status.update({ 
          status: 'read',
          readAt: new Date(),
          // Also set deliveredAt if it wasn't set before
          ...(!status.deliveredAt && { deliveredAt: new Date() })
        })
      );

      await Promise.all(updatePromises);

      // Get all chat members for WebSocket emission
      const chatMembers = await ChatMember.findAll({
        where: { chatId },
        attributes: ['userId']
      });

      // Emit status updates for each message
      if (req.io && unreadStatuses.length > 0) {
        const updatedStatuses = await MessageStatus.findAll({
          where: { 
            userId,
            id: { $in: unreadStatuses.map(s => s.id) }
          },
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'avatar']
            },
            {
              model: Message,
              attributes: ['id']
            }
          ]
        });

        updatedStatuses.forEach(status => {
          chatMembers.forEach(member => {
            req.io.to(`user_${member.userId}`).emit('message:statusUpdated', {
              messageId: status.Message.id,
              chatId,
              status,
              updatedBy: userId
            });
          });
        });
      }

      res.status(200).json({
        success: true,
        data: { updatedCount: unreadStatuses.length },
        message: 'Đánh dấu tất cả tin nhắn là đã đọc thành công'
      });
    } catch (error) {
      console.error('Error marking chat messages as read:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đánh dấu tin nhắn đã đọc'
      });
    }
  }
}

module.exports = MessageStatusController;
