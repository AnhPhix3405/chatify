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
const uploadRoute = require('./routes/uploadRoute');
const AIRoute = require('./routes/AIRoute');
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
    
    // Call management state
    this.activeCalls = new Map(); // Track active calls: callId -> { callerId, calleeId, status, startTime }
    this.userSockets = new Map(); // Track user sockets: userId -> socketId
    this.userCallStatus = new Map(); // Track user status: userId -> 'idle' | 'calling' | 'in_call'
    
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

      // Track user socket and set status to idle
      this.userSockets.set(userId, socket.id);
      this.userCallStatus.set(userId, 'idle');

      // Join user to their personal room
      socket.join(`user_${userId}`);

      // ========== EXISTING MESSAGE HANDLING ==========
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

      // ========== AUDIO CALL SIGNALING ==========
      
      // Initiate audio call
      socket.on('call:initiate', async (data) => {
        try {
          const { targetUserId, chatId } = data;
          const callerId = userId;
          
          console.log(`📞 Call initiated: ${callerId} -> ${targetUserId}`);
          
          // Check if target user is available
          const targetStatus = this.userCallStatus.get(targetUserId);
          const targetSocketId = this.userSockets.get(targetUserId);
          
          if (!targetSocketId || targetStatus !== 'idle') {
            socket.emit('call:failed', { 
              reason: targetSocketId ? 'user_busy' : 'user_offline',
              message: targetSocketId ? 'User is busy' : 'User is offline'
            });
            return;
          }
          
          // Generate unique call ID
          const callId = `call_${Date.now()}_${callerId}_${targetUserId}`;
          
          // Store call data
          this.activeCalls.set(callId, {
            callId,
            callerId,
            calleeId: targetUserId,
            chatId,
            status: 'calling',
            startTime: new Date(),
            type: 'audio'
          });
          
          // Update user statuses
          this.userCallStatus.set(callerId, 'calling');
          this.userCallStatus.set(targetUserId, 'calling');
          
          // Notify target user about incoming call
          this.io.to(`user_${targetUserId}`).emit('call:incoming', {
            callId,
            callerId,
            chatId,
            callType: 'audio'
          });
          
          // Set call timeout (30 seconds)
          setTimeout(() => {
            if (this.activeCalls.has(callId)) {
              const call = this.activeCalls.get(callId);
              if (call.status === 'calling') {
                this.handleCallTimeout(callId);
              }
            }
          }, 30000);
          
        } catch (error) {
          console.error('❌ Error initiating call:', error);
          socket.emit('call:failed', { reason: 'server_error', message: 'Failed to initiate call' });
        }
      });

      // Accept call
      socket.on('call:accept', (data) => {
        try {
          const { callId } = data;
          const call = this.activeCalls.get(callId);
          
          if (!call || call.calleeId !== userId) {
            socket.emit('call:failed', { reason: 'invalid_call', message: 'Invalid call' });
            return;
          }
          
          console.log(`📞 Call accepted: ${call.callerId} <- ${userId}`);
          
          // Update call status
          call.status = 'accepted';
          this.activeCalls.set(callId, call);
          
          // Update user statuses
          this.userCallStatus.set(call.callerId, 'in_call');
          this.userCallStatus.set(call.calleeId, 'in_call');
          
          // Notify caller that call was accepted
          this.io.to(`user_${call.callerId}`).emit('call:accepted', {
            callId,
            acceptedBy: userId
          });
          
        } catch (error) {
          console.error('❌ Error accepting call:', error);
          socket.emit('call:failed', { reason: 'server_error', message: 'Failed to accept call' });
        }
      });

      // Reject call
      socket.on('call:reject', (data) => {
        try {
          const { callId } = data;
          const call = this.activeCalls.get(callId);
          
          if (!call || call.calleeId !== userId) {
            return;
          }
          
          console.log(`📞 Call rejected: ${call.callerId} <- ${userId}`);
          
          // Notify caller about rejection
          this.io.to(`user_${call.callerId}`).emit('call:rejected', {
            callId,
            rejectedBy: userId
          });
          
          // Clean up call
          this.cleanupCall(callId);
          
        } catch (error) {
          console.error('❌ Error rejecting call:', error);
        }
      });

      // End call
      socket.on('call:end', (data) => {
        try {
          const { callId } = data;
          const call = this.activeCalls.get(callId);
          
          if (!call || (call.callerId !== userId && call.calleeId !== userId)) {
            return;
          }
          
          console.log(`📞 Call ended by: ${userId}`);
          
          // Notify other participant
          const otherUserId = call.callerId === userId ? call.calleeId : call.callerId;
          this.io.to(`user_${otherUserId}`).emit('call:ended', {
            callId,
            endedBy: userId
          });
          
          // Clean up call
          this.cleanupCall(callId);
          
        } catch (error) {
          console.error('❌ Error ending call:', error);
        }
      });

      // ========== WebRTC SIGNALING ==========
      
      // Handle WebRTC offer
      socket.on('webrtc:offer', (data) => {
        try {
          const { callId, offer } = data;
          const call = this.activeCalls.get(callId);
          
          if (!call || call.callerId !== userId) {
            return;
          }
          
          console.log(`🔄 WebRTC offer sent: ${userId} -> ${call.calleeId}`);
          
          // Forward offer to callee
          this.io.to(`user_${call.calleeId}`).emit('webrtc:offer', {
            callId,
            offer,
            fromUserId: userId
          });
          
        } catch (error) {
          console.error('❌ Error handling WebRTC offer:', error);
        }
      });

      // Handle WebRTC answer
      socket.on('webrtc:answer', (data) => {
        try {
          const { callId, answer } = data;
          const call = this.activeCalls.get(callId);
          
          if (!call || call.calleeId !== userId) {
            return;
          }
          
          console.log(`🔄 WebRTC answer sent: ${userId} -> ${call.callerId}`);
          
          // Forward answer to caller
          this.io.to(`user_${call.callerId}`).emit('webrtc:answer', {
            callId,
            answer,
            fromUserId: userId
          });
          
          // Update call status to connected
          call.status = 'connected';
          this.activeCalls.set(callId, call);
          
        } catch (error) {
          console.error('❌ Error handling WebRTC answer:', error);
        }
      });

      // Handle ICE candidates
      socket.on('webrtc:ice-candidate', (data) => {
        try {
          const { callId, candidate } = data;
          const call = this.activeCalls.get(callId);
          
          if (!call) return;
          
          // Forward ICE candidate to the other peer
          const targetUserId = call.callerId === userId ? call.calleeId : call.callerId;
          this.io.to(`user_${targetUserId}`).emit('webrtc:ice-candidate', {
            callId,
            candidate,
            fromUserId: userId
          });
          
        } catch (error) {
          console.error('❌ Error handling ICE candidate:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User ${userId} disconnected from WebSocket`);
        
        // Clean up user data
        this.userSockets.delete(userId);
        this.userCallStatus.delete(userId);
        
        // Clean up any active calls
        this.cleanupUserCalls(userId);
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
          environment: process.env.NODE_ENV,
          activeCalls: this.activeCalls.size,
          connectedUsers: this.userSockets.size
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Database connection failed',
          error: error.message
        });
      }
    });

    // Call status endpoint (for debugging)
    this.app.get('/api/calls/status', (req, res) => {
      const calls = Array.from(this.activeCalls.values());
      const users = Array.from(this.userCallStatus.entries()).map(([userId, status]) => ({
        userId,
        status,
        socketConnected: this.userSockets.has(userId)
      }));

      res.json({
        success: true,
        activeCalls: calls,
        userStatuses: users,
        totalCalls: calls.length,
        totalUsers: users.length
      });
    });

    // Sử dụng API routes
    this.app.use('/api', chatRoute);
    this.app.use('/api', messageRoute);
    this.app.use('/api', messageStatusRoute);
    this.app.use('/api', userRoute);
    this.app.use('/api', authRoute);
    this.app.use('/api', uploadRoute);
    this.app.use('/api', AIRoute);

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

  // ========== CALL MANAGEMENT HELPER METHODS ==========
  
  cleanupCall(callId) {
    const call = this.activeCalls.get(callId);
    if (call) {
      // Reset user statuses to idle
      this.userCallStatus.set(call.callerId, 'idle');
      this.userCallStatus.set(call.calleeId, 'idle');
      
      // Remove call from active calls
      this.activeCalls.delete(callId);
      
      console.log(`🧹 Call cleaned up: ${callId}`);
    }
  }

  cleanupUserCalls(userId) {
    // Find all calls involving this user
    for (let [callId, call] of this.activeCalls) {
      if (call.callerId === userId || call.calleeId === userId) {
        // Notify the other participant
        const otherUserId = call.callerId === userId ? call.calleeId : call.callerId;
        this.io.to(`user_${otherUserId}`).emit('call:ended', {
          callId,
          endedBy: userId,
          reason: 'user_disconnected'
        });
        
        // Clean up the call
        this.activeCalls.delete(callId);
        this.userCallStatus.set(otherUserId, 'idle');
        
        console.log(`🧹 User call cleaned up: ${callId} (user ${userId} disconnected)`);
      }
    }
  }

  handleCallTimeout(callId) {
    const call = this.activeCalls.get(callId);
    if (call && call.status === 'calling') {
      console.log(`⏰ Call timeout: ${callId}`);
      
      // Notify both users about timeout
      this.io.to(`user_${call.callerId}`).emit('call:timeout', { callId });
      this.io.to(`user_${call.calleeId}`).emit('call:timeout', { callId });
      
      // Clean up call
      this.cleanupCall(callId);
    }
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