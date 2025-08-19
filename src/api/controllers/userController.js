const User = require('../models/User');
const db = require('../config/database');

class UserController {
  /**
   * GET /users - Lấy danh sách tất cả user
   */
  static async getAllUsers(req, res) {
    try {
      const userModel = new User();
      const users = await userModel.findAll(db);
      
      // Remove password from response
      const safeUsers = users.map(user => {
        const { password_hash, ...safeUser } = user;
        return safeUser;
      });
      
      res.status(200).json({
        success: true,
        data: safeUsers,
        message: 'Lấy danh sách users thành công'
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách users'
      });
    }
  }

  /**
   * GET /users/:id - Lấy thông tin 1 user
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userModel = new User();
      
      const user = await userModel.findById(db, id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }
      
      // Remove password from response
      const { password_hash, ...safeUser } = user;
      
      res.status(200).json({
        success: true,
        data: safeUser,
        message: 'Lấy thông tin user thành công'
      });
    } catch (error) {
      console.error('Error getting user by id:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin user'
      });
    }
  }

  /**
   * POST /users - Tạo user mới
   */
  static async createUser(req, res) {
    try {
      const { username, email, password, avatar_url, status } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email và password là bắt buộc'
        });
      }
      
      const userModel = new User();
      
      // Check if user already exists
      const existingUserByEmail = await userModel.findByEmail(db, email);
      const existingUserByUsername = await userModel.findByUsername(db, username);
      
      if (existingUserByEmail || existingUserByUsername) {
        return res.status(409).json({
          success: false,
          message: 'Email hoặc username đã tồn tại'
        });
      }
      
      // Hash password before storing (you should use bcrypt in production)
      const password_hash = password; // TODO: Implement proper password hashing
      
      const newUser = await userModel.create(db, {
        username,
        display_name: username, // Default display_name to username
        email,
        password_hash,
        avatar_url: avatar_url || null,
        status: status || 'offline',
        last_seen: new Date().toISOString()
      });
      
      // Remove password from response
      const { password_hash: _, ...userResponse } = newUser;
      
      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'Tạo user mới thành công'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo user mới'
      });
    }
  }

  /**
   * PUT /users/:id - Cập nhật thông tin user
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, avatar_url, status } = req.body;
      
      const userModel = new User();
      const user = await userModel.findById(db, id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }
      
      // Check if username or email already exists (excluding current user)
      if (username && username !== user.username) {
        const existingUser = await userModel.findByUsername(db, username);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            message: 'Username đã được sử dụng bởi user khác'
          });
        }
      }
      
      if (email && email !== user.email) {
        const existingUser = await userModel.findByEmail(db, email);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            message: 'Email đã được sử dụng bởi user khác'
          });
        }
      }
      
      const updatedUser = await userModel.update(db, id, {
        username: username || user.username,
        display_name: username || user.display_name,
        email: email || user.email,
        password_hash: user.password_hash, // Keep existing password
        avatar_url: avatar_url !== undefined ? avatar_url : user.avatar_url,
        status: status || user.status,
        last_seen: user.last_seen
      });
      
      // Remove password from response
      const { password_hash: _, ...safeUser } = updatedUser;
      
      res.status(200).json({
        success: true,
        data: safeUser,
        message: 'Cập nhật user thành công'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật user'
      });
    }
  }

  /**
   * DELETE /users/:id - Xóa user
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const userModel = new User();
      const user = await userModel.findById(db, id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }
      
      await userModel.delete(db, id);
      
      res.status(200).json({
        success: true,
        message: 'Xóa user thành công'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa user'
      });
    }
  }

  /**
   * Update user online status (for WebSocket handling)
   */
  static async updateOnlineStatus(userId, status) {
    try {
      const userModel = new User();
      const user = await userModel.findById(db, userId);
      
      if (user) {
        await userModel.update(db, userId, {
          ...user,
          status: status,
          last_seen: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  /**
   * GET /users/search/:username - Tìm kiếm user theo username
   */
  static async searchUserByUsername(req, res) {
    try {
      const { username } = req.params;
      const userModel = new User();

      const user = await userModel.findByUsername(db, username);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user với username này'
        });
      }

      // Remove password from response
      const { password_hash, ...safeUser } = user;

      res.status(200).json({
        success: true,
        data: safeUser,
        message: 'Tìm kiếm user thành công'
      });
    } catch (error) {
      console.error('Error searching user by username:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tìm kiếm user'
      });
    }
  }
}

module.exports = UserController;
