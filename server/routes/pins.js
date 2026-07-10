const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate a new PIN (admin and subadmin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { wardName, city, expiresAt, categoryId, totalQuestions = 10 } = req.body;

    if (!wardName || !categoryId || !city) {
      return res.status(400).json({ message: 'Ward name, city, and category are required' });
    }

    // Get random questions for this PIN
    const allQuestions = await prisma.question.findMany({
      where: { categoryId: parseInt(categoryId), isActive: true },
      select: { id: true }
    });

    if (allQuestions.length === 0) {
      return res.status(400).json({ message: 'No active questions found in this category' });
    }

    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, parseInt(totalQuestions));
    const questionIds = selectedQuestions.map(q => q.id);

    // Generate a unique 6-digit PIN
    let pinCode;
    let isUnique = false;
    while (!isUnique) {
      pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.pin.findUnique({ where: { code: pinCode } });
      if (!existing) isUnique = true;
    }

    const pin = await prisma.pin.create({
      data: {
        code: pinCode,
        wardName,
        city,
        categoryId: parseInt(categoryId),
        questionIds,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        creatorId: req.user.id
      }
    });

    res.json(pin);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get all PINs (admin sees all, subadmin sees only theirs)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = req.user.role === 'subadmin' ? { creatorId: req.user.id } : {};

    const pins = await prisma.pin.findMany({
      where: query,
      include: {
        creator: { select: { doctorName: true, email: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pins);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get active PINs for user's city
router.get('/active', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const pins = await prisma.pin.findMany({
      where: {
        isActive: true,
        city: {
          equals: user.city,
          mode: 'insensitive'
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pins);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Revoke/Deactivate a PIN
router.put('/:id/revoke', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    const pin = await prisma.pin.findUnique({ where: { id } });

    if (!pin) {
      return res.status(404).json({ message: 'PIN not found' });
    }

    if (req.user.role === 'subadmin' && pin.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only revoke your own PINs' });
    }

    const updatedPin = await prisma.pin.update({
      where: { id },
      data: { isActive: false }
    });

    res.json(updatedPin);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Validate PIN (user)
router.post('/validate', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'PIN code is required' });
    }

    const pin = await prisma.pin.findUnique({ where: { code } });

    if (!pin) {
      return res.status(404).json({ message: 'Invalid PIN' });
    }

    if (!pin.isActive) {
      return res.status(400).json({ message: 'This PIN is no longer active' });
    }

    if (pin.expiresAt && new Date(pin.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This PIN has expired' });
    }

    res.json({ message: 'PIN is valid', wardName: pin.wardName });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Delete a PIN (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    const pin = await prisma.pin.findUnique({ where: { id } });

    if (!pin) {
      return res.status(404).json({ message: 'PIN not found' });
    }

    if (req.user.role === 'subadmin' && pin.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own PINs' });
    }

    await prisma.pin.delete({ where: { id } });

    res.json({ message: 'PIN deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get leaderboard for a PIN
router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    const pin = await prisma.pin.findUnique({ where: { id } });

    if (!pin) {
      return res.status(404).json({ message: 'PIN not found' });
    }

    const leaderboard = await prisma.quizSession.findMany({
      where: {
        gameMode: 'pin',
        pin: pin.code,
        isCompleted: true
      },
      include: {
        user: {
          select: { id: true, doctorName: true, specialty: true, city: true, hospitalName: true }
        }
      },
      orderBy: [
        { score: 'desc' },
        { timeSpent: 'asc' }
      ]
    });

    res.json(leaderboard);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
