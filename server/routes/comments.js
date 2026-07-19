const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// Submit a new comment (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { targetType, targetId, targetName, content } = req.body;
    
    if (!targetType || !targetId || !targetName || !content) {
      return res.status(400).json({ message: 'Missing required comment fields' });
    }

    if (!['quiz', 'material'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user.id,
        targetType,
        targetId: parseInt(targetId),
        targetName,
        content,
        status: 'Pending'
      }
    });

    res.json({ message: 'Comment submitted successfully, awaiting approval', comment });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get recent approved comments (limit 10)
router.get('/', auth, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { status: 'Approved' },
      include: {
        user: {
          select: {
            id: true,
            doctorName: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json(comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get approved comments for a specific target (quiz/material)
router.get('/target/:type/:id', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const targetId = parseInt(id);

    if (!['quiz', 'material'].includes(type) || isNaN(targetId)) {
      return res.status(400).json({ message: 'Invalid target parameters' });
    }

    const comments = await prisma.comment.findMany({
      where: {
        targetType: type,
        targetId,
        status: 'Approved'
      },
      include: {
        user: {
          select: {
            id: true,
            doctorName: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Admin/Subadmin: Get all comments (recent first)
router.get('/admin', auth, async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && !(req.user.role === 'subadmin' && (req.user.permissions?.includes('comments') || req.user.permissions?.includes('users')))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await prisma.comment.findMany({
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

    res.json(comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Admin/Subadmin: Approve or decline a comment
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

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { status }
    });

    res.json({ message: `Comment status updated to ${status}`, comment: updatedComment });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
