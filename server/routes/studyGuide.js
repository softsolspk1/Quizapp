const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/study-guides
// @desc    Get all active study guides (filtered by specialty if provided)
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

    const studyGuides = await prisma.studyGuide.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json(studyGuides);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/study-guides/all
// @desc    Get all study guides (admin only)
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studyGuides = await prisma.studyGuide.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(studyGuides);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/study-guides
// @desc    Create a new study guide (admin only)
// @access  Private
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required'),
  body('pdfUrl').notEmpty().withMessage('PDF URL is required'),
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

    const { title, pdfUrl, specialty, isActive } = req.body;

    const studyGuide = await prisma.studyGuide.create({
      data: {
        title,
        pdfUrl,
        specialty,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(studyGuide);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/study-guides/:id
// @desc    Update a study guide (admin only)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, pdfUrl, specialty, isActive } = req.body;
    const studyGuideId = parseInt(req.params.id);

    const updatedStudyGuide = await prisma.studyGuide.update({
      where: { id: studyGuideId },
      data: {
        title,
        pdfUrl,
        specialty,
        isActive
      }
    });

    res.json(updatedStudyGuide);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/study-guides/:id
// @desc    Delete a study guide (admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studyGuideId = parseInt(req.params.id);

    await prisma.studyGuide.delete({
      where: { id: studyGuideId }
    });

    res.json({ message: 'Study guide removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
