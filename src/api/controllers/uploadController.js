const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chatify/avatars',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Delete temporary file from local storage
    fs.unlinkSync(req.file.path);

    // Return Cloudinary URL
    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    // Clean up file if error occurs
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

module.exports = {
  uploadAvatar
};
