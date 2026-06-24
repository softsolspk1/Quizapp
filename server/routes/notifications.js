const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get notifications for the logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;

    // A user should receive notifications that:
    // 1. targetType === 'all'
    // 2. targetType === 'specialty' && targetValue === user.specialty
    // 3. targetType === 'city' && targetValue === user.city
    // 4. targetType === 'hospital' && targetValue === user.hospitalName
    // 5. targetType === 'role' && targetValue === user.role

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetType: 'all' },
          { targetType: 'specialty', targetValue: user.specialty },
          { targetType: 'city', targetValue: user.city },
          { targetType: 'hospital', targetValue: user.hospitalName },
          { targetType: 'role', targetValue: user.role }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/notifications/read/:id
// @desc    Mark a notification as read
// @access  Private
router.post('/read/:id', auth, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.isReadBy.includes(req.user.id)) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isReadBy: {
            push: req.user.id
          }
        }
      });
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/notifications/all
// @desc    Get all notifications created (Admin only)
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const notifications = await prisma.notification.findMany({
      include: {
        creator: {
          select: { doctorName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification broadcast (Admin only)
// @access  Private
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('targetType').isIn(['all', 'specialty', 'city', 'hospital', 'role']).withMessage('Invalid target type')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, targetType, targetValue } = req.body;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        targetType,
        targetValue,
        creatorId: req.user.id
      }
    });

    res.json(notification);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification (Admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
