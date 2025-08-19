const User = require('../models/User');
const db = require('../config/database');

class AuthController {
  /**
   * POST /auth/login - Đăng nhập
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username và password là bắt buộc'
        });
      }
      
      const userModel = new User();
      
      // Find user by username or email
      let user = await userModel.findByUsername(db, username);
      if (!user) {
        user = await userModel.findByEmail(db, username);
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }
      
      // Check password (in production, use bcrypt.compare)
      if (user.password_hash !== password) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }
      
      // Update user status to online and last_seen
      await userModel.update(db, user.id, {
        ...user,
        status: 'online',
        last_seen: new Date().toISOString()
      });
      
      // Remove password from response
      const { password_hash, ...safeUser } = user;
      
      res.status(200).json({
        success: true,
        data: {
          user: safeUser,
          token: `user_${user.id}` // Simple token for demo, use JWT in production
        },
        message: 'Đăng nhập thành công'
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập'
      });
    }
  }

  /**
   * POST /auth/register - Đăng ký tài khoản mới
   */
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email và password là bắt buộc'
        });
      }
      
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
      }
      
      // Validate username length
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Username phải từ 3-20 ký tự'
        });
      }
      
      const userModel = new User();
      
      // Check if user already exists
      const existingUserByEmail = await userModel.findByEmail(db, email);
      const existingUserByUsername = await userModel.findByUsername(db, username);
      
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
      
      if (existingUserByUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username đã được sử dụng'
        });
      }
      
      // Hash password before storing (you should use bcrypt in production)
      const password_hash = password; // TODO: Implement proper password hashing
      
      const newUser = await userModel.create(db, {
        username,
        display_name: username, // Default display_name to username
        email,
        password_hash,
        avatar_url: null,
        status: 'online',
        last_seen: new Date().toISOString()
      });
      
      // Remove password from response
      const { password_hash: _, ...userResponse } = newUser;
      
      res.status(201).json({
        success: true,
        data: {
          user: userResponse,
          token: `user_${newUser.id}` // Simple token for demo, use JWT in production
        },
        message: 'Đăng ký thành công'
      });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng ký'
      });
    }
  }

  /**
   * POST /auth/logout - Đăng xuất
   */
  static async logout(req, res) {
    try {
      const { userId } = req.body;
      
      if (userId) {
        const userModel = new User();
        const user = await userModel.findById(db, userId);
        
        if (user) {
          // Update user status to offline
          await userModel.update(db, userId, {
            ...user,
            status: 'offline',
            last_seen: new Date().toISOString()
          });
        }
      }
      
      res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng xuất'
      });
    }
  }

  /**
   * GET /auth/me - Lấy thông tin user hiện tại (verify token)
   */
  static async getCurrentUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Simple token validation (use proper JWT validation in production)
      if (!token.startsWith('user_')) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      }
      
      const userId = token.replace('user_', '');
      const userModel = new User();
      const user = await userModel.findById(db, userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User không tồn tại'
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
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin user'
      });
    }
  }
}

module.exports = AuthController;
