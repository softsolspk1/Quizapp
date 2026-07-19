const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const auth = require('../middleware/auth');

// Initialize Cloudflare R2 S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.R2_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, `quizapp_uploads/${uniqueSuffix}.${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Basic file validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// @route   POST /api/upload
// @desc    Upload an image or PDF to Cloudflare R2
// @access  Private
router.post('/', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Construct the public access URL from Cloudflare R2 public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;

    res.json({
      success: true,
      url: publicUrl,
      public_id: req.file.key
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server Error during upload' });
  }
});

module.exports = router;
