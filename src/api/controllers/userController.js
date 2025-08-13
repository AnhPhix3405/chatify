const User = require('../models/User');

class UserController {
  /**
   * GET /users - Lấy danh sách tất cả user
   */
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] } // Không trả về password
      });
      
      res.status(200).json({
        success: true,
        data: users,
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
      
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }
      
      res.status(200).json({
        success: true,
        data: user,
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
      const { username, email, password, avatar, phoneNumber } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email và password là bắt buộc'
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          $or: [{ email }, { username }]
        }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email hoặc username đã tồn tại'
        });
      }
      
      const newUser = await User.create({
        username,
        email,
        password,
        avatar,
        phoneNumber,
        isOnline: false
      });
      
      // Remove password from response
      const userResponse = newUser.toJSON();
      delete userResponse.password;
      
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
      const { username, email, avatar, phoneNumber, isOnline } = req.body;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }
      
      // Check if username or email already exists (excluding current user)
      if (username || email) {
        const existingUser = await User.findOne({
          where: {
            id: { $ne: id },
            $or: [
              username && { username },
              email && { email }
            ].filter(Boolean)
          }
        });
        
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Username hoặc email đã được sử dụng bởi user khác'
          });
        }
      }
      
      await user.update({
        ...(username && { username }),
        ...(email && { email }),
        ...(avatar !== undefined && { avatar }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(isOnline !== undefined && { isOnline })
      });
      
      const updatedUser = user.toJSON();
      delete updatedUser.password;
      
      res.status(200).json({
        success: true,
        data: updatedUser,
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
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }
      
      await user.destroy();
      
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
  static async updateOnlineStatus(userId, isOnline) {
    try {
      await User.update(
        { isOnline },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }
}

module.exports = UserController;
