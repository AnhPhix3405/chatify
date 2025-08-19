const User = require('../models/User');
const db = require('../config/database');

class AuthController {
  /**
   * POST /auth/login - User login
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username và password là bắt buộc'
        });
      }

      const userModel = new User();

      // Find user by username hoặc email
      let user = await userModel.findByUsername(db, username);
      if (!user) {
        user = await userModel.findByEmail(db, username);
      }

      // Check if user exists and password is correct
      if (user && user.password_hash === password) {
        // Remove password from response
        const { password_hash, ...safeUser } = user;
        
        return res.json({
          success: true,
          data: {
            user: safeUser
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  }

  /**
   * POST /auth/register - User registration
   */
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validate input
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

      // Create new user
      const newUser = await userModel.create(db, {
        username,
        display_name: username,
        email,
        password_hash: password, // TODO: Implement proper password hashing
        avatar_url: null,
        status: 'offline',
        last_seen: new Date().toISOString()
      });

      // Remove password from response
      const { password_hash, ...safeUser } = newUser;

      return res.status(201).json({
        success: true,
        data: {
          user: safeUser
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  }
}

module.exports = AuthController;