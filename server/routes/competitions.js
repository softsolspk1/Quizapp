const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/competitions
// @desc    Get all competitions (Admin)
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const competitions = await prisma.monthlyCompetition.findMany({
      include: {
        category: {
          select: { name: true }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(competitions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/competitions/active
// @desc    Get active competition for a user's specialty
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Find active competitions targeting this user's specialty
    const competitions = await prisma.monthlyCompetition.findMany({
      where: {
        isActive: true,
        targetSpecialty: user.specialty
      },
      include: {
        category: {
          select: { name: true }
        },
        enrollments: {
          where: { userId: user.id }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(competitions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/competitions/:id/enrollments
// @desc    Get all enrolled doctors for a specific competition
// @access  Private/Admin
router.get('/:id/enrollments', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollments = await prisma.competitionEnrollment.findMany({
      where: { competitionId: parseInt(req.params.id) },
      include: {
        user: {
          select: { id: true, doctorName: true, email: true, specialty: true, city: true, hospitalName: true, phoneNumber: true }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    res.json(enrollments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/competitions
// @desc    Create a new monthly competition
// @access  Private/Admin
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Name is required'),
  body('targetSpecialty').notEmpty().withMessage('Specialty is required'),
  body('posterUrl').notEmpty().withMessage('Poster URL is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('categoryId').isInt().withMessage('Valid Category ID is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, targetSpecialty, posterUrl, date, startTime, endTime, categoryId, isActive } = req.body;

    const competition = await prisma.monthlyCompetition.create({
      data: {
        name,
        targetSpecialty,
        posterUrl,
        date,
        startTime,
        endTime,
        categoryId: parseInt(categoryId),
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(competition);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/competitions/:id
// @desc    Update a competition
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, targetSpecialty, posterUrl, date, startTime, endTime, categoryId, isActive } = req.body;

    const competition = await prisma.monthlyCompetition.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        targetSpecialty,
        posterUrl,
        date,
        startTime,
        endTime,
        categoryId: parseInt(categoryId),
        isActive
      }
    });

    res.json(competition);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/competitions/:id
// @desc    Delete a competition
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.monthlyCompetition.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Competition deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/competitions/:id/enroll
// @desc    Enroll in a competition
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const competitionId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if competition exists
    const competition = await prisma.monthlyCompetition.findUnique({
      where: { id: competitionId }
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    if (!competition.isActive) {
      return res.status(400).json({ message: 'Competition is not active' });
    }

    // Check if already enrolled
    const existing = await prisma.competitionEnrollment.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    await prisma.competitionEnrollment.create({
      data: {
        userId,
        competitionId
      }
    });

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
