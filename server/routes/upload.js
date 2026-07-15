const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      return {
        folder: 'quizapp_uploads',
        resource_type: 'raw'
      };
    }
    return {
      folder: 'quizapp_uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf']
    };
  }
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Private
router.post('/', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      url: req.file.path || req.file.secure_url || req.file.url,
      public_id: req.file.filename || req.file.public_id
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server Error during upload' });
  }
});

module.exports = router;
