const ChatMember = require('../models/ChatMember');
const Chat = require('../models/Chat');
const User = require('../models/User');

class ChatMemberController {
  /**
   * GET /chats/:chatId/members - Lấy danh sách thành viên
   */
  static async getChatMembers(req, res) {
    try {
      const { chatId } = req.params;

      // Check if chat exists
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      const members = await ChatMember.findAll({
        where: { chatId },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email', 'avatar', 'isOnline', 'createdAt']
          }
        ],
        order: [['joinedAt', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: members,
        message: 'Lấy danh sách thành viên thành công'
      });
    } catch (error) {
      console.error('Error getting chat members:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách thành viên'
      });
    }
  }

  /**
   * POST /chats/:chatId/members - Thêm thành viên vào chat
   */
  static async addChatMember(req, res) {
    try {
      const { chatId } = req.params;
      const { userId, addedBy, role = 'member' } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'UserId là bắt buộc'
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

      // For group chats, check if the person adding is admin
      if (chat.isGroup && addedBy) {
        const adderMember = await ChatMember.findOne({
          where: { chatId, userId: addedBy }
        });

        if (!adderMember || adderMember.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có thể thêm thành viên'
          });
        }
      }

      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }

      // Check if user is already a member
      const existingMember = await ChatMember.findOne({
        where: { chatId, userId }
      });

      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: 'User đã là thành viên của chat này'
        });
      }

      // Add new member
      const newMember = await ChatMember.create({
        chatId,
        userId,
        role: role || 'member'
      });

      // Get complete member info
      const memberWithUser = await ChatMember.findByPk(newMember.id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email', 'avatar', 'isOnline']
          }
        ]
      });

      // Get all chat members for WebSocket emission
      const allMembers = await ChatMember.findAll({
        where: { chatId },
        attributes: ['userId']
      });

      // Emit WebSocket event to all chat members
      if (req.io) {
        allMembers.forEach(member => {
          req.io.to(`user_${member.userId}`).emit('chat:memberAdded', {
            chatId,
            member: memberWithUser,
            addedBy
          });
        });
      }

      res.status(201).json({
        success: true,
        data: memberWithUser,
        message: 'Thêm thành viên thành công'
      });
    } catch (error) {
      console.error('Error adding chat member:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi thêm thành viên'
      });
    }
  }

  /**
   * DELETE /chats/:chatId/members/:userId - Xóa thành viên khỏi chat
   */
  static async removeChatMember(req, res) {
    try {
      const { chatId, userId } = req.params;
      const { removedBy } = req.body;

      // Check if chat exists
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Find the member to remove
      const member = await ChatMember.findOne({
        where: { chatId, userId },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar']
          }
        ]
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành viên trong chat này'
        });
      }

      // For group chats, check permissions
      if (chat.isGroup && removedBy && removedBy !== userId) {
        const removerMember = await ChatMember.findOne({
          where: { chatId, userId: removedBy }
        });

        // Only admin can remove others, or user can remove themselves
        if (!removerMember || removerMember.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có thể xóa thành viên khác'
          });
        }

        // Cannot remove the chat creator unless they're removing themselves
        if (chat.createdBy === userId && removedBy !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Không thể xóa người tạo chat'
          });
        }
      }

      // Get all chat members before removing for WebSocket emission
      const allMembers = await ChatMember.findAll({
        where: { chatId },
        attributes: ['userId']
      });

      // Remove member
      await member.destroy();

      // For 1-1 chats, if one member leaves, delete the chat
      if (!chat.isGroup) {
        const remainingMembers = await ChatMember.count({
          where: { chatId }
        });

        if (remainingMembers < 2) {
          await chat.destroy();
          
          // Emit chat deleted event
          if (req.io) {
            allMembers.forEach(memberItem => {
              req.io.to(`user_${memberItem.userId}`).emit('chat:deleted', {
                chatId,
                reason: 'member_left'
              });
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Rời chat và xóa cuộc trò chuyện thành công'
          });
        }
      }

      // Emit WebSocket event to all remaining members
      if (req.io) {
        allMembers.forEach(memberItem => {
          if (memberItem.userId !== userId) { // Don't emit to the removed user
            req.io.to(`user_${memberItem.userId}`).emit('chat:memberRemoved', {
              chatId,
              removedMember: member,
              removedBy
            });
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Xóa thành viên thành công'
      });
    } catch (error) {
      console.error('Error removing chat member:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa thành viên'
      });
    }
  }

  /**
   * PUT /chats/:chatId/members/:userId/role - Cập nhật role của thành viên
   */
  static async updateMemberRole(req, res) {
    try {
      const { chatId, userId } = req.params;
      const { role, updatedBy } = req.body;

      if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role không hợp lệ. Chỉ chấp nhận "admin" hoặc "member"'
        });
      }

      // Check if chat exists and is a group chat
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      if (!chat.isGroup) {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể cập nhật role trong chat nhóm'
        });
      }

      // Check if updater is admin
      const updaterMember = await ChatMember.findOne({
        where: { chatId, userId: updatedBy }
      });

      if (!updaterMember || updaterMember.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ admin mới có thể cập nhật role thành viên'
        });
      }

      // Find member to update
      const member = await ChatMember.findOne({
        where: { chatId, userId }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thành viên trong chat này'
        });
      }

      // Cannot change role of chat creator
      if (chat.createdBy === userId) {
        return res.status(403).json({
          success: false,
          message: 'Không thể thay đổi role của người tạo chat'
        });
      }

      // Update role
      await member.update({ role });

      const updatedMember = await ChatMember.findOne({
        where: { chatId, userId },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar']
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: updatedMember,
        message: 'Cập nhật role thành viên thành công'
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật role thành viên'
      });
    }
  }
}

module.exports = ChatMemberController;
