const MessageStatus = require('../models/MessageStatus');
const Message = require('../models/Message');
const ChatMember = require('../models/ChatMember');
const User = require('../models/User');
const db = require('../config/database');

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

      const messageModel = new Message();
      const messageStatusModel = new MessageStatus();
      const chatMemberModel = new ChatMember();
      const userModel = new User();

      // Check if message exists
      const message = await messageModel.findById(db, id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      // Check if user is member of the chat
      const isMember = await chatMemberModel.findByChatAndUser(db, message.chat_id, userId);

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải thành viên của chat này'
        });
      }

      // Find existing message status
      let messageStatus = await messageStatusModel.findByMessageAndUser(db, id, userId);

      if (!messageStatus) {
        // Create new status if doesn't exist
        const statusData = {
          message_id: parseInt(id),
          user_id: parseInt(userId),
          status
        };
        messageStatus = await messageStatusModel.create(db, statusData);
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

        messageStatus = await messageStatusModel.updateStatusByMessageAndUser(db, id, userId, status);
      }

      // Get user info
      const user = await userModel.findById(db, userId);
      const statusWithUser = {
        ...messageStatus,
        user: user ? {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        } : null
      };

      // Get all chat members for WebSocket emission
      const chatMembers = await chatMemberModel.findByChatId(db, message.chat_id);

      // Emit WebSocket event to all chat members
      if (req.io) {
        chatMembers.forEach(member => {
          req.io.to(`user_${member.user_id}`).emit('message:statusUpdated', {
            messageId: id,
            chatId: message.chat_id,
            status: statusWithUser,
            updatedBy: userId
          });
        });
      }

      res.status(200).json({
        success: true,
        data: statusWithUser,
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

      const messageModel = new Message();
      const messageStatusModel = new MessageStatus();
      const userModel = new User();

      // Check if message exists
      const message = await messageModel.findById(db, id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      const statuses = await messageStatusModel.findByMessageId(db, id);

      // Get user info for each status
      const statusesWithUser = await Promise.all(
        statuses.map(async (status) => {
          const user = await userModel.findById(db, status.user_id);
          return {
            ...status,
            user: user ? {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url
            } : null
          };
        })
      );

      res.status(200).json({
        success: true,
        data: statusesWithUser,
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

      const messageStatusModel = new MessageStatus();
      const messageModel = new Message();
      const chatMemberModel = new ChatMember();
      const userModel = new User();

      // Find message status
      const messageStatus = await messageStatusModel.findByMessageAndUser(db, messageId, userId);

      if (!messageStatus) {
        socket.emit('error', { message: 'Không tìm thấy trạng thái tin nhắn' });
        return;
      }

      // Update to delivered if currently sent
      if (messageStatus.status === 'sent') {
        const updatedStatus = await messageStatusModel.updateStatusByMessageAndUser(db, messageId, userId, 'delivered');

        // Get message for chat info
        const message = await messageModel.findById(db, messageId);
        
        // Get all chat members for emission
        const chatMembers = await chatMemberModel.findByChatId(db, message.chat_id);

        // Get user info
        const user = await userModel.findById(db, userId);
        const statusWithUser = {
          ...updatedStatus,
          user: user ? {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url
          } : null
        };

        // Emit to all chat members
        chatMembers.forEach(member => {
          io.to(`user_${member.user_id}`).emit('message:statusUpdated', {
            messageId,
            chatId: message.chat_id,
            status: statusWithUser,
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

      const messageStatusModel = new MessageStatus();
      const messageModel = new Message();
      const chatMemberModel = new ChatMember();
      const userModel = new User();

      // Find message status
      const messageStatus = await messageStatusModel.findByMessageAndUser(db, messageId, userId);

      if (!messageStatus) {
        socket.emit('error', { message: 'Không tìm thấy trạng thái tin nhắn' });
        return;
      }

      // Update to read (from any previous status)
      const updatedStatus = await messageStatusModel.updateStatusByMessageAndUser(db, messageId, userId, 'read');

      // Get message for chat info
      const message = await messageModel.findById(db, messageId);
      
      // Get all chat members for emission
      const chatMembers = await chatMemberModel.findByChatId(db, message.chat_id);

      // Get user info
      const user = await userModel.findById(db, userId);
      const statusWithUser = {
        ...updatedStatus,
        user: user ? {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        } : null
      };

      // Emit to all chat members
      chatMembers.forEach(member => {
        io.to(`user_${member.user_id}`).emit('message:statusUpdated', {
          messageId,
          chatId: message.chat_id,
          status: statusWithUser,
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

      const chatMemberModel = new ChatMember();
      const messageStatusModel = new MessageStatus();
      const messageModel = new Message();
      const userModel = new User();

      // Check if user is member of the chat
      const isMember = await chatMemberModel.findByChatAndUser(db, chatId, userId);

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải thành viên của chat này'
        });
      }

      // Get all unread message statuses in this chat for this user
      const unreadStatusQuery = `
        SELECT ms.* FROM message_status ms
        INNER JOIN messages m ON ms.message_id = m.id
        WHERE m.chat_id = $1 AND ms.user_id = $2 AND ms.status IN ('sent', 'delivered')
      `;
      const unreadResult = await db.query(unreadStatusQuery, [chatId, userId]);
      const unreadStatuses = unreadResult.rows;

      // Update all to read
      const updatePromises = unreadStatuses.map(status =>
        messageStatusModel.updateStatus(db, status.id, 'read')
      );

      await Promise.all(updatePromises);

      // Get all chat members for WebSocket emission
      const chatMembers = await chatMemberModel.findByChatId(db, chatId);

      // Get user info
      const user = await userModel.findById(db, userId);

      // Emit status updates for each message
      if (req.io && unreadStatuses.length > 0) {
        for (const status of unreadStatuses) {
          const updatedStatus = await messageStatusModel.findById(db, status.id);
          const statusWithUser = {
            ...updatedStatus,
            user: user ? {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url
            } : null
          };

          chatMembers.forEach(member => {
            req.io.to(`user_${member.user_id}`).emit('message:statusUpdated', {
              messageId: status.message_id,
              chatId,
              status: statusWithUser,
              updatedBy: userId
            });
          });
        }
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
