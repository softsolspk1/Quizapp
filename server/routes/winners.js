const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/winners
// @desc    Get all winners (for admin)
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const winners = await prisma.winner.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(winners);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/winners/active
// @desc    Get the active winner of the month (for mobile app)
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const activeWinner = await prisma.winner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(activeWinner);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/winners
// @desc    Create a new winner
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
    // This is handled by the first route.
});

router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { title, imageUrl, month, year, isActive } = req.body;

    // If setting as active, maybe deactivate others (optional, depending on requirement)
    if (isActive) {
      await prisma.winner.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const winner = await prisma.winner.create({
      data: {
        title,
        imageUrl,
        month,
        year,
        isActive
      }
    });

    res.json(winner);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/winners/:id
// @desc    Update a winner
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { title, imageUrl, month, year, isActive } = req.body;

    if (isActive) {
      await prisma.winner.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const winner = await prisma.winner.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        imageUrl,
        month,
        year,
        isActive
      }
    });

    res.json(winner);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/winners/:id
// @desc    Delete a winner
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await prisma.winner.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Winner removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
