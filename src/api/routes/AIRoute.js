const express = require('express');
const AIController = require('../controllers/AIController');

const router = express.Router();

// POST /api/ai/gemini - Chat với AI sử dụng Gemini
router.post('/gemini', AIController.chatWithGemini);

module.exports = router;
