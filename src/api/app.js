require('dotenv').config({ path: '../../.env' }); // Load từ root directory
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

class ChatifyAPI {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 10000; // Render uses port 10000
    this.initDatabase();
    this.setupMiddleware();
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

    // Test database query endpoint
    this.app.get('/api/test-db', async (req, res) => {
      try {
        const client = await this.db.connect();
        const result = await client.query(`
          SELECT 
            current_database() as database,
            current_user as user,
            version() as version,
            NOW() as timestamp
        `);
        client.release();

        res.json({
          success: true,
          data: result.rows[0]
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Database query failed',
          error: error.message
        });
      }
    });

    // Get all users endpoint
    this.app.get('/api/users', async (req, res) => {
      try {
        const client = await this.db.connect();
        const result = await client.query('SELECT * FROM users');
        client.release();

        res.json({
          success: true,
          data: result.rows,
          count: result.rows.length,
          message: 'Users retrieved successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch users',
          error: error.message
        });
      }
    });

    // Get user by ID endpoint
    this.app.get('/api/users/:id', async (req, res) => {
      try {
        const client = await this.db.connect();
        const result = await client.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        client.release();

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        res.json({
          success: true,
          data: result.rows[0],
          message: 'User retrieved successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user',
          error: error.message
        });
      }
    });

    // Check if users table exists and show structure
    this.app.get('/api/users/schema/info', async (req, res) => {
      try {
        const client = await this.db.connect();
        
        // Check if users table exists
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          );
        `);

        if (!tableExists.rows[0].exists) {
          client.release();
          return res.json({
            success: false,
            message: 'Users table does not exist',
            suggestion: 'You need to create the users table first'
          });
        }

        // Get table structure
        const structure = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          ORDER BY ordinal_position;
        `);

        // Get row count
        const count = await client.query('SELECT COUNT(*) as total FROM users');

        client.release();

        res.json({
          success: true,
          table_exists: true,
          total_records: parseInt(count.rows[0].total),
          table_structure: structure.rows,
          message: 'Users table information retrieved successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get table information',
          error: error.message
        });
      }
    });

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
    this.app.listen(this.port, () => {
      console.log(`
🚀 Chatify API Server Started
📍 Port: ${this.port}
🌍 Environment: ${process.env.NODE_ENV}
🔗 Database: ${process.env.DB_HOST}
📊 Database Name: ${process.env.DB_NAME}
👤 Database User: ${process.env.DB_USER}
📱 Frontend: ${process.env.FRONTEND_URL}
      `);
    });
  }
}

// Start server
const server = new ChatifyAPI();
server.start();

module.exports = ChatifyAPI;
