require('dotenv').config({ path: '../../.env' }); // Load từ root directory
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');
const chatRoute = require('./routes/chatRoute')
const messageRoute = require('./routes/messageRoute')
const messageStatusRoute = require('./routes/messageStatusRoute')
const userRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRoute');
class ChatifyAPI {
  constructor() {
    this.app = express();
    this.server = createServer(this.app); // Create HTTP server
    this.io = new Server(this.server, {   // Create Socket.IO server
      cors: {
        origin: "*", // Allow all origins for now, restrict in production
        methods: ["GET", "POST"]
      }
    });
    this.port = process.env.PORT || 10000; // Render uses port 10000
    this.initDatabase();
    this.setupMiddleware();
    this.setupWebSocket();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  initDatabase() {
    // Kết nối PostgreSQL - hỗ trợ cả Neon.tech và Render PostgreSQL
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        require: true
      } : false,
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    // Fallback to DATABASE_URL if individual params not available (Render style)
    if (process.env.DATABASE_URL && !process.env.DB_HOST) {
      dbConfig.connectionString = process.env.DATABASE_URL;
      dbConfig.ssl = {
        rejectUnauthorized: false
      };
    }

    this.db = new Pool(dbConfig);

    // Test connection
    this.testConnection();
  }

  async testConnection() {
    try {
      const client = await this.db.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Connected to Neon.tech database successfully');
      console.log('🕐 Server time:', result.rows[0].current_time);
      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Connection details:', {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      });
    }
  }

  setupMiddleware() {
    // CORS configuration - cập nhật cho production
    this.app.use(cors({
      origin: [
        'http://localhost:5173', // for development
        'https://chatify-neon-five.vercel.app', // your production domain
        /\.render\.com$/ // Allow any Render domain
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Security middleware
    this.app.use(helmet());

    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Add io to request object for controllers
    this.app.use((req, res, next) => {
      req.io = this.io;
      next();
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId;
      
      if (!userId) {
        console.error('User ID is missing in WebSocket connection');
        socket.disconnect();
        return;
      }

      console.log(`🔌 User ${userId} connected via WebSocket`);
      socket.userId = userId;

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // Handle message send event
      socket.on('message:send', async (data) => {
        try {
          console.log('📨 Received message via WebSocket:', data);
          const MessageController = require('./controllers/messageController');
          await MessageController.handleWebSocketMessage(socket, this.io, data);
        } catch (error) {
          console.error('❌ Error handling WebSocket message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User ${userId} disconnected from WebSocket`);
      });
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        // Test database connection
        const client = await this.db.connect();
        await client.query('SELECT 1');
        client.release();

        res.json({
          success: true,
          message: 'Chatify API is running',
          timestamp: new Date().toISOString(),
          version: process.env.API_VERSION || 'v1',
          database: 'Connected',
          environment: process.env.NODE_ENV
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Database connection failed',
          error: error.message
        });
      }
    });

    // Sử dụng API routes
    this.app.use('/api', chatRoute);
    this.app.use('/api', messageRoute);
    this.app.use('/api', messageStatusRoute);
    this.app.use('/api', userRoute);
    this.app.use('/api', authRoute);

    // API routes
    this.app.use(`/api/${process.env.API_VERSION || 'v1'}`, (req, res) => {
      res.json({
        success: true,
        message: 'Chatify API endpoints',
        endpoints: [
          'GET /health - Health check',
          'GET /api/test-db - Test database connection',
          'GET /api/users - Get all users',
          'GET /api/users/:id - Get user by ID',
          'GET /api/users/schema/info - Get users table info',
          'GET /api/v1/chats - Get all chats',
          'POST /api/v1/chats - Create new chat',
          'POST /api/v1/auth/login - User login',
          'POST /api/v1/auth/register - User registration'
        ]
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Server Error:', error.message);
      
      res.status(error.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`
🚀 Chatify API Server Started
📍 Port: ${this.port}
🌍 Environment: ${process.env.NODE_ENV}
🔗 Database: ${process.env.DB_HOST}
📊 Database Name: ${process.env.DB_NAME}
👤 Database User: ${process.env.DB_USER}
📱 Frontend: ${process.env.FRONTEND_URL}
🔌 WebSocket: Available at /socket.io/
      `);
    });
  }
}

// Start server
const server = new ChatifyAPI();
server.start();

module.exports = ChatifyAPI;