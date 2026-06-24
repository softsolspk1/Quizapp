const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/banners
// @desc    Get all active banners (filtered by specialty if provided)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { specialty } = req.query;
    
    const whereClause = { isActive: true };
    if (specialty) {
      whereClause.OR = [
        { specialty: 'All' },
        { specialty }
      ];
    }

    const banners = await prisma.banner.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json(banners);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/banners/all
// @desc    Get all banners (admin only)
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(banners);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/banners
// @desc    Create a new banner (admin only)
// @access  Private
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required'),
  body('imageUrl').notEmpty().withMessage('Image URL is required'),
  body('specialty').notEmpty().withMessage('Specialty is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, imageUrl, specialty, isActive } = req.body;

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        specialty,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(banner);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/banners/:id
// @desc    Update a banner (admin only)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, imageUrl, specialty, isActive } = req.body;
    const bannerId = parseInt(req.params.id);

    const updatedBanner = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        title,
        imageUrl,
        specialty,
        isActive
      }
    });

    res.json(updatedBanner);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/banners/:id
// @desc    Delete a banner (admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bannerId = parseInt(req.params.id);

    await prisma.banner.delete({
      where: { id: bannerId }
    });

    res.json({ message: 'Banner removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
