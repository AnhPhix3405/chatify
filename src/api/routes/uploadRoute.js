const express = require('express');
const upload = require('../middleware/multer');
const { uploadAvatar } = require('../controllers/uploadController');

const router = express.Router();

// POST /uploads/avatar - Upload avatar image
router.post('/uploads/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
