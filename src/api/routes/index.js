const express = require('express');
const router = express.Router();

// Import route modules
const authRoute = require('./authRoute');
const userRoute = require('./userRoute');
const chatRoute = require('./chatRoute');
const messageRoute = require('./messageRoute');
const chatMemberRoute = require('./chatMemberRoute');
const messageStatusRoute = require('./messageStatusRoute');

// Import controllers (for backward compatibility)
const UserController = require('../controllers/userController');

// Auth routes
router.use('/auth', authRoute);

// API routes
router.use('/users', userRoute);
router.use('/chats', chatRoute);
router.use('/messages', messageRoute);
router.use('/chat-members', chatMemberRoute);
router.use('/message-status', messageStatusRoute);

// Legacy User routes (for backward compatibility)
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

module.exports = router;
