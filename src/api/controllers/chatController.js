const Chat = require('../models/Chat');
const ChatMember = require('../models/ChatMember');
const User = require('../models/User');
const Message = require('../models/Message');
const db = require('../config/database');

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

      const chatMemberModel = new ChatMember();
      const chatModel = new Chat();
      const userModel = new User();

      // Get all chats where user is a member
      const userChatMemberships = await chatMemberModel.findByUserId(db, userId);
      
      const chats = await Promise.all(
        userChatMemberships.map(async (membership) => {
          const chat = await chatModel.findById(db, membership.chat_id);
          
          // Get all members of this chat
          const chatMembers = await chatMemberModel.findByChatId(db, membership.chat_id);
          const membersWithUserInfo = await Promise.all(
            chatMembers.map(async (member) => {
              const user = await userModel.findById(db, member.user_id);
              return {
                ...member,
                user: user ? { 
                  id: user.id, 
                  username: user.username, 
                  avatar_url: user.avatar_url, 
                  status: user.status 
                } : null
              };
            })
          );
          
          return {
            ...chat,
            members: membersWithUserInfo
          };
        })
      );

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

      const chatModel = new Chat();
      const chatMemberModel = new ChatMember();
      const userModel = new User();

      const chat = await chatModel.findById(db, id);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Get all members of this chat
      const chatMembers = await chatMemberModel.findByChatId(db, id);
      const membersWithUserInfo = await Promise.all(
        chatMembers.map(async (member) => {
          const user = await userModel.findById(db, member.user_id);
          return {
            ...member,
            user: user ? { 
              id: user.id, 
              username: user.username, 
              avatar_url: user.avatar_url, 
              status: user.status 
            } : null
          };
        })
      );

      const chatWithMembers = {
        ...chat,
        members: membersWithUserInfo
      };

      res.status(200).json({
        success: true,
        data: chatWithMembers,
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
      const { name, type, avatar_url, memberIds, created_by } = req.body;

      if (!memberIds || memberIds.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách thành viên không được trống'
        });
      }

      if (!created_by) {
        return res.status(400).json({
          success: false,
          message: 'created_by là bắt buộc'
        });
      }

      const chatModel = new Chat();
      const chatMemberModel = new ChatMember();

      // For 1-1 chat, check if chat already exists between these users
      if (type === 'direct' && memberIds.length === 1) {
        // Get all chats where both users are members
        const user1Chats = await chatMemberModel.findByUserId(db, created_by);
        const user2Chats = await chatMemberModel.findByUserId(db, memberIds[0]);
        
        // Find common direct chats
        const commonChats = user1Chats.filter(chat1 => 
          user2Chats.some(chat2 => chat1.chat_id === chat2.chat_id)
        );
        
        for (let commonChat of commonChats) {
          const chat = await chatModel.findById(db, commonChat.chat_id);
          if (chat && chat.type === 'direct') {
            // Get chat with members info
            const chatMembers = await chatMemberModel.findByChatId(db, chat.id);
            const membersWithUserInfo = await Promise.all(
              chatMembers.map(async (member) => {
                const userModel = new User();
                const user = await userModel.findById(db, member.user_id);
                return {
                  ...member,
                  user: user ? { 
                    id: user.id, 
                    username: user.username, 
                    avatar_url: user.avatar_url, 
                    status: user.status 
                  } : null
                };
              })
            );
            
            return res.status(200).json({
              success: true,
              data: { ...chat, members: membersWithUserInfo },
              message: 'Chat đã tồn tại'
            });
          }
        }
      }

      // Create new chat
      const chatData = {
        type: type || 'group',
        name: (type === 'group' && name) ? name : null,
        avatar_url: (type === 'group' && avatar_url) ? avatar_url : null,
        created_by
      };

      const newChat = await chatModel.create(db, chatData);

      // Add creator to members list if not already included
      const allMemberIds = [created_by, ...memberIds.filter(id => id !== created_by)];

      // Create chat members
      await Promise.all(
        allMemberIds.map(async (userId) => {
          const memberData = {
            chat_id: newChat.id,
            user_id: userId,
            role: userId === created_by ? 'admin' : 'member'
          };
          return await chatMemberModel.create(db, memberData);
        })
      );

      // Get complete chat info with members
      const chatMembers = await chatMemberModel.findByChatId(db, newChat.id);
      const userModel = new User();
      const membersWithUserInfo = await Promise.all(
        chatMembers.map(async (member) => {
          const user = await userModel.findById(db, member.user_id);
          return {
            ...member,
            user: user ? { 
              id: user.id, 
              username: user.username, 
              avatar_url: user.avatar_url, 
              status: user.status 
            } : null
          };
        })
      );

      const chatWithMembers = {
        ...newChat,
        members: membersWithUserInfo
      };

      // Emit WebSocket event
      if (req.io) {
        // Emit to all members
        allMemberIds.forEach(userId => {
          req.io.to(`user_${userId}`).emit('chat:created', {
            chat: chatWithMembers,
            createdBy: created_by
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
      const { name, avatar_url, updatedBy } = req.body;

      const chatModel = new Chat();
      const chatMemberModel = new ChatMember();
      const userModel = new User();

      const chat = await chatModel.findById(db, id);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Check if user is admin (for group chats)
      if (chat.type === 'group' && updatedBy) {
        const memberRole = await chatMemberModel.findByChatAndUser(db, id, updatedBy);

        if (!memberRole || memberRole.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có thể cập nhật thông tin nhóm'
          });
        }
      }

      // Update chat data
      const updateData = {
        type: chat.type,
        name: name !== undefined ? name : chat.name,
        avatar_url: avatar_url !== undefined ? avatar_url : chat.avatar_url,
        created_by: chat.created_by
      };

      const updatedChat = await chatModel.update(db, id, updateData);

      // Get updated chat with members
      const chatMembers = await chatMemberModel.findByChatId(db, id);
      const membersWithUserInfo = await Promise.all(
        chatMembers.map(async (member) => {
          const user = await userModel.findById(db, member.user_id);
          return {
            ...member,
            user: user ? { 
              id: user.id, 
              username: user.username, 
              avatar_url: user.avatar_url, 
              status: user.status 
            } : null
          };
        })
      );

      const chatWithMembers = {
        ...updatedChat,
        members: membersWithUserInfo
      };

      // Emit WebSocket event
      if (req.io) {
        const memberIds = membersWithUserInfo.map(member => member.user_id);
        memberIds.forEach(userId => {
          req.io.to(`user_${userId}`).emit('chat:updated', {
            chat: chatWithMembers,
            updatedBy
          });
        });
      }

      res.status(200).json({
        success: true,
        data: chatWithMembers,
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

      const chatModel = new Chat();
      const chatMemberModel = new ChatMember();

      const chat = await chatModel.findById(db, id);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chat'
        });
      }

      // Get all members before deletion
      const chatMembers = await chatMemberModel.findByChatId(db, id);

      // Check if user is admin or creator
      if (chat.type === 'group' && deletedBy) {
        const memberRole = await chatMemberModel.findByChatAndUser(db, id, deletedBy);

        if (!memberRole || (memberRole.role !== 'admin' && chat.created_by !== deletedBy)) {
          return res.status(403).json({
            success: false,
            message: 'Chỉ admin hoặc người tạo mới có thể xóa chat'
          });
        }
      }

      const memberIds = chatMembers.map(member => member.user_id);

      // Delete chat members first
      await Promise.all(
        chatMembers.map(member => 
          chatMemberModel.delete(db, member.id)
        )
      );

      // Delete chat
      await chatModel.delete(db, id);

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

  /**
   * GET /chats/:chatId/last-message - Lấy tin nhắn cuối cùng của 1 chat
   */
  static async getLastMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { userId } = req.query;

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

      // Check if user is member of the chat (optional check)
      if (userId) {
        const isMember = await chatMemberModel.findByChatAndUser(db, chatId, userId);
        if (!isMember) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không phải thành viên của chat này'
          });
        }
      }

      // Get last message
      const lastMessage = await messageModel.getLatestByChatId(db, chatId);
      
      if (!lastMessage) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'Chat chưa có tin nhắn nào'
        });
      }

      // Get sender info
      const sender = await userModel.findById(db, lastMessage.sender_id);
      const messageWithSender = {
        ...lastMessage,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          avatar_url: sender.avatar_url
        } : null
      };

      res.status(200).json({
        success: true,
        data: messageWithSender,
        message: 'Lấy tin nhắn cuối cùng thành công'
      });
    } catch (error) {
      console.error('Error getting last message:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy tin nhắn cuối cùng'
      });
    }
  }

  /**
   * GET /chats/user/:userId/with-last-messages - Lấy danh sách chat của user với tin nhắn cuối cùng
   */
  static async getUserChatsWithLastMessages(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'UserId là bắt buộc'
        });
      }

      const chatMemberModel = new ChatMember();
      const chatModel = new Chat();
      const userModel = new User();
      const messageModel = new Message();

      // Get all chats where user is a member
      const userChatMemberships = await chatMemberModel.findByUserId(db, userId);
      
      const chats = await Promise.all(
        userChatMemberships.map(async (membership) => {
          const chat = await chatModel.findById(db, membership.chat_id);
          
          // Get all members of this chat
          const chatMembers = await chatMemberModel.findByChatId(db, membership.chat_id);
          const membersWithUserInfo = await Promise.all(
            chatMembers.map(async (member) => {
              const user = await userModel.findById(db, member.user_id);
              return {
                ...member,
                user: user ? { 
                  id: user.id, 
                  username: user.username, 
                  avatar_url: user.avatar_url, 
                  status: user.status 
                } : null
              };
            })
          );

          // Get last message
          const lastMessage = await messageModel.getLatestByChatId(db, membership.chat_id);
          let lastMessageWithSender = null;
          
          if (lastMessage) {
            const sender = await userModel.findById(db, lastMessage.sender_id);
            lastMessageWithSender = {
              ...lastMessage,
              sender: sender ? {
                id: sender.id,
                username: sender.username,
                avatar_url: sender.avatar_url
              } : null
            };
          }
          
          return {
            ...chat,
            members: membersWithUserInfo,
            lastMessage: lastMessageWithSender
          };
        })
      );

      res.status(200).json({
        success: true,
        data: chats,
        message: 'Lấy danh sách chat với tin nhắn cuối cùng thành công'
      });
    } catch (error) {
      console.error('Error getting user chats with last messages:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách chat'
      });
    }
  }
}

module.exports = ChatController;
