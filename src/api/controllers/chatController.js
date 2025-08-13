const Chat = require('../models/Chat');
const ChatMember = require('../models/ChatMember');
const User = require('../models/User');

class ChatController {
  /**
   * GET /chats - Lấy danh sách chat của 1 user
   */
  static async getUserChats(req, res) {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'UserId là bắt buộc'
        });
      }

      const chats = await Chat.findAll({
        include: [
          {
            model: ChatMember,
            where: { userId },
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'avatar', 'isOnline']
              }
            ]
          },
          {
            model: ChatMember,
            as: 'members',
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'avatar', 'isOnline']
              }
            ]
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: chats,
        message: 'Lấy danh sách chat thành công'
      });
    } catch (error) {
      console.error('Error getting user chats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách chat'
      });
    }
  }

  /**
   * GET /chats/:id - Lấy thông tin 1 chat cụ thể
   */
  static async getChatById(req, res) {
    try {
      const { id } = req.params;

      const chat = await Chat.findByPk(id, {
        include: [
          {
            model: ChatMember,
            as: 'members',
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'avatar', 'isOnline']
              }
            ]
          }
        ]
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      res.status(200).json({
        success: true,
        data: chat,
        message: 'Lấy thông tin chat thành công'
      });
    } catch (error) {
      console.error('Error getting chat by id:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin chat'
      });
    }
  }

  /**
   * POST /chats - Tạo chat mới (1-1 hoặc group)
   */
  static async createChat(req, res) {
    try {
      const { name, isGroup, avatar, memberIds, createdBy } = req.body;

      if (!memberIds || memberIds.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách thành viên không được trống'
        });
      }

      if (!createdBy) {
        return res.status(400).json({
          success: false,
          message: 'CreatedBy là bắt buộc'
        });
      }

      // For 1-1 chat, check if chat already exists
      if (!isGroup && memberIds.length === 1) {
        const existingChat = await Chat.findOne({
          where: { isGroup: false },
          include: [
            {
              model: ChatMember,
              where: {
                userId: { $in: [createdBy, memberIds[0]] }
              }
            }
          ],
          having: {
            '$ChatMembers.count$': 2
          }
        });

        if (existingChat) {
          return res.status(200).json({
            success: true,
            data: existingChat,
            message: 'Chat đã tồn tại'
          });
        }
      }

      // Create new chat
      const newChat = await Chat.create({
        name: isGroup ? name : null,
        isGroup: isGroup || false,
        avatar: isGroup ? avatar : null,
        createdBy
      });

      // Add creator to members list if not already included
      const allMemberIds = [createdBy, ...memberIds.filter(id => id !== createdBy)];

      // Create chat members
      const chatMembers = await Promise.all(
        allMemberIds.map(userId =>
          ChatMember.create({
            chatId: newChat.id,
            userId,
            role: userId === createdBy ? 'admin' : 'member'
          })
        )
      );

      // Get complete chat info with members
      const chatWithMembers = await Chat.findByPk(newChat.id, {
        include: [
          {
            model: ChatMember,
            as: 'members',
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'avatar', 'isOnline']
              }
            ]
          }
        ]
      });

      // Emit WebSocket event
      if (req.io) {
        // Emit to all members
        allMemberIds.forEach(userId => {
          req.io.to(`user_${userId}`).emit('chat:created', {
            chat: chatWithMembers,
            createdBy
          });
        });
      }

      res.status(201).json({
        success: true,
        data: chatWithMembers,
        message: 'Tạo chat mới thành công'
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo chat mới'
      });
    }
  }

  /**
   * PUT /chats/:id - Cập nhật thông tin chat
   */
  static async updateChat(req, res) {
    try {
      const { id } = req.params;
      const { name, avatar, updatedBy } = req.body;

      const chat = await Chat.findByPk(id);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Check if user is admin (for group chats)
      if (chat.isGroup && updatedBy) {
        const memberRole = await ChatMember.findOne({
          where: { chatId: id, userId: updatedBy }
        });

        if (!memberRole || memberRole.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có thể cập nhật thông tin nhóm'
          });
        }
      }

      await chat.update({
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar })
      });

      // Get updated chat with members
      const updatedChat = await Chat.findByPk(id, {
        include: [
          {
            model: ChatMember,
            as: 'members',
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'avatar', 'isOnline']
              }
            ]
          }
        ]
      });

      // Emit WebSocket event
      if (req.io) {
        const memberIds = updatedChat.members.map(member => member.userId);
        memberIds.forEach(userId => {
          req.io.to(`user_${userId}`).emit('chat:updated', {
            chat: updatedChat,
            updatedBy
          });
        });
      }

      res.status(200).json({
        success: true,
        data: updatedChat,
        message: 'Cập nhật chat thành công'
      });
    } catch (error) {
      console.error('Error updating chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật chat'
      });
    }
  }

  /**
   * DELETE /chats/:id - Xóa chat
   */
  static async deleteChat(req, res) {
    try {
      const { id } = req.params;
      const { deletedBy } = req.body;

      const chat = await Chat.findByPk(id, {
        include: [
          {
            model: ChatMember,
            as: 'members'
          }
        ]
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Check if user is admin or creator
      if (chat.isGroup && deletedBy) {
        const memberRole = await ChatMember.findOne({
          where: { chatId: id, userId: deletedBy }
        });

        if (!memberRole || (memberRole.role !== 'admin' && chat.createdBy !== deletedBy)) {
          return res.status(403).json({
            success: false,
            message: 'Chỉ admin hoặc người tạo mới có thể xóa chat'
          });
        }
      }

      const memberIds = chat.members.map(member => member.userId);

      // Delete chat (cascade will delete members and messages)
      await chat.destroy();

      // Emit WebSocket event
      if (req.io) {
        memberIds.forEach(userId => {
          req.io.to(`user_${userId}`).emit('chat:deleted', {
            chatId: id,
            deletedBy
          });
        });
      }

      res.status(200).json({
        success: true,
        message: 'Xóa chat thành công'
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa chat'
      });
    }
  }
}

module.exports = ChatController;
