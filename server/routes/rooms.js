const express = require('express');
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/rooms
// @desc    Create a new multiplayer room
// @access  Private
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Room name is required'),
  body('isOpen').isBoolean().withMessage('isOpen must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, isOpen, specialty, city, hospitalName, difficulty } = req.body;
    const { id } = req.user;

    let isUnique = false;
    let pin;
    while (!isUnique) {
      pin = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await prisma.room.findUnique({ where: { pin } });
      if (!existing) {
        isUnique = true;
      }
    }

    const room = await prisma.room.create({
      data: {
        name,
        specialty,
        city,
        hospitalName,
        pin,
        isOpen,
        creatorId: id,
        difficulty: difficulty || 'medium'
      }
    });

    res.json(room);
  } catch (error) {
    console.error('Create room error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/rooms
// @desc    Get all active rooms with optional filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { specialty, city, hospitalName } = req.query;

    const where = {};
    if (specialty) where.specialty = { contains: specialty, mode: 'insensitive' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (hospitalName) where.hospitalName = { contains: hospitalName, mode: 'insensitive' };

    const rooms = await prisma.room.findMany({
      where,
      include: {
        creator: {
          select: {
            doctorName: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room (creator only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await prisma.room.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Room removed' });
  } catch (error) {
    console.error('Delete room error:', error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
