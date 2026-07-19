const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// Submit a new feedback (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Feedback content is required' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user.id,
        content: content.trim(),
        status: 'Pending'
      }
    });

    res.json({ message: 'Feedback submitted successfully, awaiting approval', feedback });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get approved feedbacks
router.get('/', auth, async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { status: 'Approved' },
      include: {
        user: {
          select: {
            id: true,
            doctorName: true,
            profilePicture: true,
            specialty: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(feedbacks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Admin/Subadmin: Get all feedbacks (recent first)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && !(req.user.role === 'subadmin' && (req.user.permissions?.includes('comments') || req.user.permissions?.includes('users')))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            doctorName: true,
            profilePicture: true,
            specialty: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(feedbacks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Admin/Subadmin: Approve or decline feedback
router.put('/:id/status', auth, async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && !(req.user.role === 'subadmin' && (req.user.permissions?.includes('comments') || req.user.permissions?.includes('users')))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['Approved', 'Declined', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { status }
    });

    res.json({ message: `Feedback status updated to ${status}`, feedback: updatedFeedback });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
